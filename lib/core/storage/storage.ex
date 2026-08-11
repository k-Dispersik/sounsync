defmodule Core.Storage do
  @moduledoc """
  Facade over the configured storage adapter.

  The only module that knows adapters exist. Everything else calls
  `Core.Storage.put/3` and stays unaware of whether the bytes end up in
  `priv/uploads` or in a bucket — which is the point: switching is a config
  line, not a code change.
  """

  alias Core.Storage.Adapter

  @spec put(Adapter.key(), iodata() | {:file, Path.t()}, Adapter.opts()) ::
          {:ok, Adapter.key()} | {:error, term()}
  def put(key, data, opts \\ []), do: adapter().put(key, data, opts)

  @spec get_url(Adapter.key(), Adapter.opts()) :: {:ok, String.t()} | {:error, term()}
  def get_url(key, opts \\ []), do: adapter().get_url(key, opts)

  @spec upload_url(Adapter.key(), Adapter.opts()) ::
          {:ok, Adapter.upload_instruction()} | {:error, term()}
  def upload_url(key, opts \\ []), do: adapter().upload_url(key, opts)

  @spec delete(Adapter.key()) :: :ok | {:error, term()}
  def delete(key), do: adapter().delete(key)

  @spec stat(Adapter.key()) :: {:ok, Adapter.stat()} | {:error, term()}
  def stat(key), do: adapter().stat(key)

  @doc "The adapter module in use. Public so tests can assert on it."
  def adapter, do: Keyword.fetch!(config(), :adapter)

  @doc "Largest upload we accept, in bytes."
  def max_upload_bytes, do: Keyword.fetch!(config(), :max_upload_bytes)

  @doc "Content types we accept. Claimed type is checked again after upload."
  def allowed_content_types, do: Keyword.fetch!(config(), :allowed_content_types)

  @doc "How long an upload instruction stays valid."
  def upload_url_ttl_seconds, do: Keyword.fetch!(config(), :upload_url_ttl_seconds)

  @doc "Adapter-specific settings, e.g. the local root or the bucket name."
  def config(key, default \\ nil), do: Keyword.get(config(), key, default)

  @doc "Builds the key for a file. Never derived from the name the client sent."
  @spec build_key(pos_integer(), String.t()) :: Adapter.key()
  def build_key(project_id, original_filename) do
    extension = original_filename |> Path.extname() |> sanitise_extension()
    "projects/#{project_id}/audio/#{Ecto.UUID.generate()}#{extension}"
  end

  # Anything but a short alphanumeric suffix is dropped rather than escaped:
  # the extension is a convenience, not data worth preserving.
  defp sanitise_extension(extension) do
    case Regex.run(~r/^\.([A-Za-z0-9]{1,8})$/, extension) do
      [_whole, suffix] -> "." <> String.downcase(suffix)
      nil -> ""
    end
  end

  defp config, do: Application.fetch_env!(:soundsync, :storage)
end
