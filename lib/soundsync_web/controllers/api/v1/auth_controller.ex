defmodule SoundsyncWeb.API.V1.AuthController do
  @moduledoc """
  Registration and sessions: `/v1/auth`.
  """

  use SoundsyncWeb, :controller
  use Params

  alias Core.Accounts
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams

  action_fallback SoundsyncWeb.FallbackController

  defparams(
    register_params(%{
      name: :string,
      email!: :string,
      password!: :string
    })
  )

  defparams(
    login_params(%{
      email!: :string,
      password!: :string
    })
  )

  def register(conn, params) do
    with {:ok, attrs} <- RequestParams.cast(&register_params/1, params),
         {:ok, user} <- register_user(attrs) do
      respond_with_token(conn, user, :created)
    end
  end

  def login(conn, params) do
    with {:ok, %{email: email, password: password}} <-
           RequestParams.cast(&login_params/1, params),
         {:ok, user} <- Accounts.authenticate(email, password) do
      respond_with_token(conn, user, :ok)
    end
  end

  def logout(conn, _params) do
    :ok = Accounts.delete_session_token(conn.assigns.session_token)
    send_resp(conn, :no_content, "")
  end

  def me(conn, _params) do
    conn.assigns.current_user
    |> JSON.user()
    |> Helpers.response(conn, :ok)
  end

  defp register_user(attrs) do
    case Accounts.register_user(attrs) do
      {:ok, user} -> {:ok, user}
      {:error, changeset} -> {:error, changeset, "Registration failed"}
    end
  end

  defp respond_with_token(conn, user, status) do
    %{token: Accounts.create_session_token(user), user: JSON.user(user)}
    |> Helpers.response(conn, status)
  end
end
