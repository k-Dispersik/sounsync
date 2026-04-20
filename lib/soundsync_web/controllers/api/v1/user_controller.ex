defmodule SoundsyncWeb.API.V1.UserController do
  use SoundsyncWeb, :controller

  alias Core.UsersCtx.Users
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON

  def get(conn, %{"id" => id}) do
    case Users.get(id) do
      nil -> Helpers.response(%{error: "User not found"}, conn, :not_found)

      user -> JSON.user(user) |> Helpers.response(conn, :ok)
    end
  end
end
