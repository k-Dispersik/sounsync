defmodule Core.Storage do
  @moduledoc """
  Facade over the configured storage adapter.

  The only module that knows adapters exist. Everything else calls
  `Core.Storage.put/3` and stays unaware of whether the bytes end up in
  `priv/uploads` or in a bucket — which is the point: switching is a config
  line, not a code change.
  """

  import Ecto.Query, only: [from: 2]

  alias Core.Accounts.User
  alias Core.Projects.Project
  alias Core.Storage.Adapter
  alias Core.Storage.AudioFile
  alias Soundsync.Repo

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

  # ── Uploads ────────────────────────────────────────────────────────────────

  @doc """
  Registers an upload and says where to send the bytes.

  The claimed content type and size are checked here, before anything is
  written; both are checked again on completion, because a claim in a request
  body is not evidence. If the project already holds a file with the same
  checksum, that file is returned and no upload happens at all.
  """
  @spec announce_upload(Project.t(), User.t(), map()) ::
          {:ok, %{audio_file: AudioFile.t(), upload: Adapter.upload_instruction() | nil}}
          | {:error, term()}
  def announce_upload(%Project{} = project, %User{} = user, attrs) do
    with :ok <- validate_content_type(attrs[:content_type]),
         :ok <- validate_size(attrs[:byte_size]) do
      case find_by_checksum(project, attrs[:checksum]) do
        %AudioFile{} = existing -> {:ok, %{audio_file: existing, upload: nil}}
        nil -> register(project, user, attrs)
      end
    end
  end

  @doc "Fetches an audio file by id, or `nil`."
  def get_audio_file(id), do: Repo.get(AudioFile, id)

  @doc "Files belonging to a project, newest first."
  def list_audio_files(%Project{} = project) do
    Repo.all(from f in AudioFile, where: f.project_id == ^project.id, order_by: [desc: f.id])
  end

  defp register(project, user, attrs) do
    key = build_key(project.id, attrs[:original_filename] || "audio")

    changeset =
      AudioFile.changeset(%AudioFile{}, %{
        project_id: project.id,
        uploaded_by_id: user.id,
        storage_key: key,
        original_filename: attrs[:original_filename],
        content_type: attrs[:content_type],
        byte_size: attrs[:byte_size],
        checksum: attrs[:checksum]
      })

    with {:ok, audio_file} <- Repo.insert(changeset),
         {:ok, instruction} <- upload_instruction(audio_file) do
      {:ok, %{audio_file: audio_file, upload: instruction}}
    end
  end

  defp upload_instruction(%AudioFile{} = audio_file) do
    upload_url(audio_file.storage_key,
      content_type: audio_file.content_type,
      upload_path: "/v1/uploads/#{audio_file.id}/data"
    )
  end

  defp find_by_checksum(_project, nil), do: nil

  defp find_by_checksum(project, checksum) do
    Repo.get_by(AudioFile, project_id: project.id, checksum: checksum)
  end

  defp validate_content_type(content_type) do
    if content_type in allowed_content_types(),
      do: :ok,
      else: {:error, :unsupported_content_type}
  end

  defp validate_size(byte_size) when is_integer(byte_size) and byte_size > 0 do
    if byte_size <= max_upload_bytes(), do: :ok, else: {:error, :file_too_large}
  end

  defp validate_size(_byte_size), do: {:error, :invalid_byte_size}

  defp config, do: Application.fetch_env!(:soundsync, :storage)
end
