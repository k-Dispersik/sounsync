defmodule SoundsyncWeb.Plugs.Auth do
  @moduledoc """
  Turns an `Authorization: Bearer <token>` header into `conn.assigns.current_user`.

  Two plugs on purpose. `fetch_current_user/2` runs for every API request and
  only looks: an endpoint that is fine with anonymous callers keeps working.
  `require_auth/2` is what actually closes a route, so protecting something is
  a visible line in the router rather than a condition buried in a controller.
  """

  import Plug.Conn

  alias Core.Accounts
  alias Core.DB.User
  alias SoundsyncWeb.ErrorResponse

  def fetch_current_user(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         %User{} = user <- Accounts.get_user_by_session_token(token) do
      conn
      |> assign(:current_user, user)
      |> assign(:session_token, token)
    else
      _ ->
        conn
        |> assign(:current_user, nil)
        |> assign(:session_token, nil)
    end
  end

  def require_auth(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> ErrorResponse.send_error(:unauthorized)
      |> halt()
    end
  end
end
