defmodule SoundsyncWeb.ErrorResponse do
  @moduledoc """
  The one shape every API error comes back in:

      {"error": {"code": "not_found", "message": "Project not found", "details": {}}}

  A single shape is what lets the client tell "you may not do that" from "the
  database fell over" without parsing prose. `code` is for the client to branch
  on, `message` is for a human, `details` carries per-field validation errors
  and is empty otherwise.

  Unexpected failures never carry their cause into the response: an `inspect/1`
  of a changeset or a Postgrex error is a description of our internals. It goes
  to the log with the request id instead, so the two can still be tied together.
  """

  import Phoenix.Controller, only: [json: 2]
  import Plug.Conn

  require Logger

  @type reason ::
          :unauthorized
          | :invalid_credentials
          | :forbidden
          | :not_found
          | :invalid_params
          | :unsupported_content_type
          | :file_too_large
          | Ecto.Changeset.t()
          | term()

  @spec send_error(Plug.Conn.t(), reason(), String.t() | nil) :: Plug.Conn.t()
  def send_error(conn, reason, message \\ nil)

  def send_error(conn, :unauthorized, message),
    do: respond(conn, 401, "unauthorized", message || "Unauthorized")

  def send_error(conn, :invalid_credentials, message),
    do: respond(conn, 401, "invalid_credentials", message || "Invalid email or password")

  def send_error(conn, :forbidden, message),
    do: respond(conn, 403, "forbidden", message || "Forbidden")

  def send_error(conn, :not_found, message),
    do: respond(conn, 404, "not_found", message || "Not found")

  def send_error(conn, :unsupported_content_type, message),
    do:
      respond(
        conn,
        422,
        "unsupported_content_type",
        message || "That file type is not supported"
      )

  def send_error(conn, :file_too_large, message),
    do: respond(conn, 413, "file_too_large", message || "That file is too large")

  def send_error(conn, :invalid_byte_size, message),
    do: respond(conn, 422, "invalid_params", message || "byte_size must be a positive integer")

  def send_error(conn, :content_type_mismatch, message),
    do:
      respond(
        conn,
        422,
        "content_type_mismatch",
        message || "The file is not the type it was announced as"
      )

  def send_error(conn, :upload_missing, message),
    do: respond(conn, 422, "upload_missing", message || "The file was never uploaded")

  def send_error(conn, :size_mismatch, message),
    do:
      respond(
        conn,
        422,
        "size_mismatch",
        message || "The uploaded file is not the size that was announced"
      )

  def send_error(conn, :invalid_params, message),
    do: respond(conn, 422, "invalid_params", message || "Invalid parameters")

  def send_error(conn, %Ecto.Changeset{} = changeset, message) do
    respond(
      conn,
      422,
      "validation_failed",
      message || "Validation failed",
      field_errors(changeset)
    )
  end

  def send_error(conn, reason, _message) do
    request_id = request_id(conn)
    Logger.error("unhandled controller error", request_id: request_id, reason: inspect(reason))

    conn
    |> put_status(500)
    |> json(%{
      error: %{
        code: "internal_error",
        message: "Something went wrong on our side",
        details: %{},
        request_id: request_id
      }
    })
  end

  @doc "Per-field messages of a changeset, with interpolations already applied."
  def field_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _whole, key ->
        opts |> Keyword.get(String.to_existing_atom(key), "") |> to_string()
      end)
    end)
  end

  defp respond(conn, status, code, message, details \\ %{}) do
    conn
    |> put_status(status)
    |> json(%{error: %{code: code, message: message, details: details}})
  end

  defp request_id(conn) do
    case get_resp_header(conn, "x-request-id") do
      [id | _rest] -> id
      [] -> nil
    end
  end
end
