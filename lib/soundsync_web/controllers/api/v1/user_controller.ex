defmodule SoundsyncWeb.API.V1.UserController do
  use SoundsyncWeb, :controller

  alias Core.UsersCtx.Users

  def get(conn, %{"id" => id}) do
    case Users.get(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "User not found"})

      user ->
        json(conn, %{
          id: user.id,
          name: user.name,
          email: user.email
        })
    end
  end
end
