defmodule Soundsync.S3Stub do
  @moduledoc """
  An in-memory bucket, served through the same HTTP interface the S3 adapter
  talks to.

  Enough of S3 to run the storage contract against: objects, ranged reads and
  the status codes the adapter branches on. Anything more would be testing
  Amazon rather than our code.
  """

  use Agent

  def start_link(_opts \\ []), do: Agent.start_link(fn -> %{} end)

  @doc "A `Req` plug backed by the given store."
  def plug(store) do
    fn conn ->
      key = String.trim_leading(conn.request_path, "/")

      case conn.method do
        "PUT" -> put(conn, store, key)
        "GET" -> get(conn, store, key)
        "HEAD" -> head(conn, store, key)
        "DELETE" -> delete(conn, store, key)
      end
    end
  end

  defp put(conn, store, key) do
    {:ok, body, conn} = Plug.Conn.read_body(conn)
    content_type = header(conn, "content-type") || "application/octet-stream"

    Agent.update(store, &Map.put(&1, key, {body, content_type}))
    Plug.Conn.send_resp(conn, 200, "")
  end

  defp get(conn, store, key) do
    case Agent.get(store, &Map.get(&1, key)) do
      nil ->
        Plug.Conn.send_resp(conn, 404, "")

      {body, _content_type} ->
        case header(conn, "range") do
          "bytes=0-" <> last ->
            length = String.to_integer(last) + 1
            Plug.Conn.send_resp(conn, 206, binary_part(body, 0, min(length, byte_size(body))))

          _no_range ->
            Plug.Conn.send_resp(conn, 200, body)
        end
    end
  end

  defp head(conn, store, key) do
    case Agent.get(store, &Map.get(&1, key)) do
      nil ->
        Plug.Conn.send_resp(conn, 404, "")

      {body, content_type} ->
        conn
        |> Plug.Conn.put_resp_header("content-length", Integer.to_string(byte_size(body)))
        |> Plug.Conn.put_resp_header("content-type", content_type)
        |> Plug.Conn.send_resp(200, "")
    end
  end

  defp delete(conn, store, key) do
    Agent.update(store, &Map.delete(&1, key))
    Plug.Conn.send_resp(conn, 204, "")
  end

  defp header(conn, name) do
    case Plug.Conn.get_req_header(conn, name) do
      [value | _rest] -> value
      [] -> nil
    end
  end
end
