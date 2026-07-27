defmodule SoundsyncWeb.API.V1.AuthController do
  use SoundsyncWeb, :controller

  alias Core.Accounts
  alias SoundsyncWeb.ErrorResponse
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON

  @registration_fields ~w(name email password)

  def register(conn, params) do
    case Accounts.register_user(Map.take(params, @registration_fields)) do
      {:ok, user} ->
        respond_with_token(conn, user, :created)

      {:error, changeset} ->
        ErrorResponse.send_error(conn, changeset, "Registration failed")
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate(email, password) do
      {:ok, user} ->
        respond_with_token(conn, user, :ok)

      {:error, :invalid_credentials} ->
        ErrorResponse.send_error(conn, :unauthorized, "Invalid email or password")
    end
  end

  def login(conn, _params) do
    ErrorResponse.send_error(conn, :invalid_params, "email and password are required")
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

  defp respond_with_token(conn, user, status) do
    %{token: Accounts.create_session_token(user), user: JSON.user(user)}
    |> Helpers.response(conn, status)
  end
end
