defmodule SoundsyncWeb.FallbackController do
  @moduledoc """
  Translates whatever an action returns instead of a `conn` into an HTTP
  answer. Actions describe the happy path and let `with/1` fall out; the
  mapping from a domain reason to a status code lives here, once.
  """

  use SoundsyncWeb, :controller

  alias SoundsyncWeb.ErrorResponse

  def call(conn, {:error, reason}), do: ErrorResponse.send_error(conn, reason)
  def call(conn, {:error, reason, message}), do: ErrorResponse.send_error(conn, reason, message)
  def call(conn, nil), do: ErrorResponse.send_error(conn, :not_found)
  def call(conn, other), do: ErrorResponse.send_error(conn, other)
end
