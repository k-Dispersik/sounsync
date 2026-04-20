defmodule SoundsyncWeb.Helpers do
  import Plug.Conn
  import Phoenix.Controller

  def response(data, conn, status) do
    conn
    |> put_status(status)
    |> json(data)
  end
end
