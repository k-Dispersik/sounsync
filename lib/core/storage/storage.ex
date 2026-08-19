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
  alias Core.Storage.Analysis
  alias Core.Storage.AudioFile
  alias Core.Storage.Local
  alias Core.Storage.Signature
  alias Soundsync.Repo

  @spec put(Adapter.key(), iodata() | {:file, Path.t()}, Adapter.opts()) ::
          {:ok, Adapter.key()} | {:error, term()}
  def put(key, data, opts \\ []), do: adapter().put(key, data, opts)

  @spec get_url(Adapter.key(), Adapter.opts()) :: {:ok, String.t()} | {:error, term()}
  def get_url(key, opts \\ []), do: adapter().get_url(key, opts)

  @spec upload_url(Adapter.key(), Adapter.opts()) ::
          {:ok, Adapter.upload_instruction()} | {:error, term()}
  def upload_url(key, opts \\ []), do: adapter().upload_url(key, opts)

  @spec read(Adapter.key(), Adapter.opts()) :: {:ok, binary()} | {:error, term()}
  def read(key, opts \\ []), do: adapter().read(key, opts)

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

  @doc """
  Confirms that the bytes actually arrived and are what was announced.

  Two checks, both against the stored object rather than the request that
  described it: the size must match what was claimed, and the first bytes must
  belong to a format we can play and agree with the declared content type. A
  file that fails either is deleted — keeping it would mean keeping something
  we have already decided not to trust.
  """
  @spec complete_upload(AudioFile.t()) :: {:ok, AudioFile.t()} | {:error, term()}
  def complete_upload(%AudioFile{status: :ready} = audio_file), do: {:ok, audio_file}

  def complete_upload(%AudioFile{} = audio_file) do
    case verify(audio_file) do
      :ok ->
        analyse_later(audio_file)
        {:ok, audio_file}

      {:error, reason} ->
        reject(audio_file, reason)
    end
  end

  @doc """
  Measures the file and marks it usable.

  Called from a background task after an upload is confirmed; exposed because
  the analysis is worth being able to run — and test — on its own.
  """
  @spec analyse(AudioFile.t()) :: {:ok, AudioFile.t()} | {:error, term()}
  def analyse(%AudioFile{} = audio_file) do
    with {:ok, path} <- local_copy(audio_file),
         {:ok, measured} <- Analysis.analyse(path) do
      cleanup(audio_file, path)

      audio_file
      |> AudioFile.analysed_changeset(Map.put(measured, :status, :ready))
      |> Repo.update()
    else
      {:error, reason} -> reject(audio_file, reason)
    end
  end

  # ffmpeg reads files, not URLs we would have to sign. For the local adapter
  # the file is already on disk; for S3 it is fetched into a temporary file.
  defp local_copy(%AudioFile{} = audio_file) do
    if adapter() == Local do
      {:ok, Path.join(Path.expand(Local.root()), audio_file.storage_key)}
    else
      copy_to_tmp(audio_file)
    end
  end

  # sobelow_skip ["Traversal.FileModule"]
  # The path is built here from the system temp dir and the file's own id;
  # nothing from a request reaches it.
  defp copy_to_tmp(audio_file) do
    with {:ok, bytes} <- read(audio_file.storage_key) do
      path = Path.join(System.tmp_dir!(), "soundsync-analysis-#{audio_file.id}")
      File.write!(path, bytes)
      {:ok, path}
    end
  end

  # sobelow_skip ["Traversal.FileModule"]
  # The path is one this module built a moment ago under the system temp dir,
  # and the guard re-checks that before removing anything.
  defp cleanup(%AudioFile{}, path) do
    if String.starts_with?(path, System.tmp_dir!()), do: File.rm(path)
    :ok
  end

  defp analyse_later(audio_file) do
    case Keyword.get(config(), :analysis, :async) do
      :inline ->
        analyse(audio_file)

      :async ->
        Task.Supervisor.start_child(Soundsync.TaskSupervisor, fn -> analyse(audio_file) end)
    end

    :ok
  end

  defp verify(audio_file) do
    case stat(audio_file.storage_key) do
      {:ok, %{size: size}} ->
        with :ok <- verify_size(audio_file, size),
             {:ok, head} <- read(audio_file.storage_key, length: Signature.probe_size()) do
          verify_signature(audio_file, head)
        end

      # Completing an upload whose bytes never arrived is the client's mistake,
      # not ours, so it must not read as a server error.
      {:error, :enoent} ->
        {:error, :upload_missing}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp verify_size(%AudioFile{byte_size: announced}, announced), do: :ok
  defp verify_size(_audio_file, _actual), do: {:error, :size_mismatch}

  defp verify_signature(audio_file, head) do
    case Signature.detect(head) do
      {:ok, format} ->
        if Signature.matches?(format, audio_file.content_type),
          do: :ok,
          else: {:error, :content_type_mismatch}

      :error ->
        {:error, :unsupported_content_type}
    end
  end

  defp reject(audio_file, reason) do
    delete(audio_file.storage_key)
    {:ok, _failed} = mark(audio_file, :failed)
    {:error, reason}
  end

  defp mark(audio_file, status) do
    audio_file
    |> AudioFile.analysed_changeset(%{status: status})
    |> Repo.update()
  end

  @doc "Fetches an audio file by id, or `nil`."
  def get_audio_file(id), do: Repo.get(AudioFile, id)

  @doc "Files belonging to a project, newest first."
  def list_audio_files(%Project{} = project) do
    Repo.all(from f in AudioFile, where: f.project_id == ^project.id, order_by: [desc: f.id])
  end

  @doc """
  Fetches a file that belongs to this project, or `nil`.

  Scoped to the project on purpose: a clip may only point at audio from its own
  project, and checking that by id alone would let anyone who can guess a
  number attach someone else's recording.
  """
  def get_project_audio_file(%Project{} = project, id) do
    Repo.get_by(AudioFile, id: id, project_id: project.id)
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
