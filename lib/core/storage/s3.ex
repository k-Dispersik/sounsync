defmodule Core.Storage.S3 do
  @moduledoc """
  Stores files in an S3 bucket. Used in production.

  Uploads and downloads never pass through the application: the client is
  handed a presigned URL and talks to S3 directly. Fifty megabytes through the
  BEAM would be bandwidth, memory and timeouts spent on moving bytes we do not
  need to look at.

  `ex_aws` is used for signing only; the handful of requests this module makes
  itself go through `Req`, which is already a dependency and which `Req.Test`
  can stub in tests. That keeps a second HTTP client out of the tree.
  """

  @behaviour Core.Storage.Adapter

  alias Core.Storage

  @impl true
  def put(key, data, opts \\ []) do
    body = to_body(data)

    case request(:put, key, body: body, headers: content_type_headers(opts)) do
      {:ok, %{status: status}} when status in 200..299 -> {:ok, key}
      {:ok, %{status: status}} -> {:error, {:unexpected_status, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  @impl true
  def get_url(key, opts \\ []) do
    case public_base_url() do
      nil -> presign(:get, key, opts)
      base -> {:ok, base |> String.trim_trailing("/") |> Kernel.<>("/" <> key)}
    end
  end

  @impl true
  def upload_url(key, opts \\ []) do
    with {:ok, url} <- presign(:put, key, opts) do
      {:ok,
       %{
         method: "PUT",
         url: url,
         headers: content_type_headers(opts) |> Map.new(),
         expires_at: DateTime.add(DateTime.utc_now(), ttl(), :second)
       }}
    end
  end

  @impl true
  def read(key, opts \\ []) do
    headers =
      case Keyword.get(opts, :length) do
        nil -> []
        length -> [{"range", "bytes=0-#{length - 1}"}]
      end

    case request(:get, key, headers: headers) do
      {:ok, %{status: status, body: body}} when status in [200, 206] -> {:ok, body}
      {:ok, %{status: 404}} -> {:error, :enoent}
      {:ok, %{status: status}} -> {:error, {:unexpected_status, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  @impl true
  def delete(key) do
    case request(:delete, key) do
      {:ok, %{status: status}} when status in [204, 200] -> :ok
      {:ok, %{status: status}} -> {:error, {:unexpected_status, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  @impl true
  def stat(key) do
    case request(:head, key) do
      {:ok, %{status: 200} = response} ->
        {:ok,
         %{
           size: response |> header("content-length") |> String.to_integer(),
           content_type: header(response, "content-type") || "application/octet-stream"
         }}

      {:ok, %{status: 404}} ->
        {:error, :enoent}

      {:ok, %{status: status}} ->
        {:error, {:unexpected_status, status}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp presign(method, key, opts) do
    ExAws.Config.new(:s3)
    |> ExAws.S3.presigned_url(method, bucket(), key, presign_opts(opts))
  end

  defp presign_opts(opts) do
    query_params =
      case Keyword.get(opts, :content_type) do
        nil -> []
        content_type -> [{"Content-Type", content_type}]
      end

    [expires_in: ttl(), query_params: query_params]
  end

  defp request(method, key, opts \\ []) do
    Req.request(
      [method: method, url: object_url(key), retry: false]
      |> Keyword.merge(opts)
      |> Keyword.merge(Application.get_env(:soundsync, :s3_req_options, []))
    )
  end

  defp object_url(key), do: "https://#{bucket()}.s3.#{region()}.amazonaws.com/#{key}"

  defp header(response, name) do
    case Req.Response.get_header(response, name) do
      [value | _rest] -> value
      [] -> nil
    end
  end

  # sobelow_skip ["Traversal.FileModule"]
  # The path is ours: it names a file the application just wrote itself while
  # handling an upload, never a value that came from a request.
  defp to_body({:file, path}), do: File.read!(path)
  defp to_body(data), do: data

  defp content_type_headers(opts) do
    case Keyword.get(opts, :content_type) do
      nil -> []
      content_type -> [{"content-type", content_type}]
    end
  end

  defp bucket, do: Storage.config(:bucket) || raise(ArgumentError, "storage :bucket is not set")
  defp region, do: Storage.config(:region) || "us-east-1"
  defp public_base_url, do: Storage.config(:public_base_url)
  defp ttl, do: Storage.upload_url_ttl_seconds()
end
