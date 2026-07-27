defmodule SoundsyncWeb.API.V1.UserController do
  use SoundsyncWeb, :controller

  alias Core.UsersCtx.Users
  alias SoundsyncWeb.ErrorResponse
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON

  def show(conn, %{"id" => id}) do
    case Users.get(id) do
      nil -> ErrorResponse.send_error(conn, :not_found, "User not found")
      user -> JSON.user(user) |> Helpers.response(conn, :ok)
    end
  end
end
