defmodule SoundsyncWeb.PageController do
  use SoundsyncWeb, :controller

  def index(conn, _params) do
    conn
    |> put_root_layout(false)
    |> render(:index)
  end
end
