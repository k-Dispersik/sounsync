defmodule SoundsyncWeb.API.V1.UserController do
  use SoundsyncWeb, :controller

  alias Core.Accounts
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams

  action_fallback SoundsyncWeb.FallbackController

  def show(conn, %{"id" => id}) do
    with {:ok, user_id} <- RequestParams.cast_id(id),
         user when not is_nil(user) <- Accounts.get_user(user_id) do
      user |> JSON.user() |> Helpers.response(conn, :ok)
    else
      nil -> {:error, :not_found, "User not found"}
      error -> error
    end
  end
end
