defmodule SoundsyncWeb.API.V1.UploadController do
  @moduledoc """
  Uploading audio into a project.

  Announcing an upload and sending the bytes are two separate requests on
  purpose: the bytes go straight to the store, so in production they never
  travel through this application at all. The local adapter emulates that with
  `PUT /v1/uploads/:id/data`, so the client code is the same either way.
  """

  use SoundsyncWeb, :controller
  use Params

  alias Core.Storage
  alias Core.Storage.AudioFile
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams
  alias SoundsyncWeb.ProjectScope

  action_fallback SoundsyncWeb.FallbackController

  defparams(
    announce_params(%{
      original_filename!: :string,
      content_type!: :string,
      byte_size!: :integer,
      checksum: :string
    })
  )

  def create(conn, %{"project_id" => project_id} = params) do
    with {:ok, attrs} <- RequestParams.cast(&announce_params/1, params),
         {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, result} <- Storage.announce_upload(project, conn.assigns.current_user, attrs) do
      result |> JSON.upload() |> Helpers.response(conn, :created)
    end
  end

  @doc """
  Receives the bytes for the local adapter. In production the client PUTs to a
  presigned URL and this action is never called.
  """
  def data(conn, %{"id" => id}) do
    with {:ok, audio_file} <- fetch_writable(conn, id),
         {:ok, body, conn} <- read_upload(conn),
         {:ok, _key} <-
           Storage.put(audio_file.storage_key, body, content_type: audio_file.content_type) do
      send_resp(conn, :no_content, "")
    end
  end

  defp fetch_writable(conn, id) do
    with {:ok, file_id} <- RequestParams.cast_id(id),
         %AudioFile{} = audio_file <- Storage.get_audio_file(file_id),
         {:ok, _project} <- ProjectScope.fetch(conn, audio_file.project_id, :write) do
      {:ok, audio_file}
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  # One read with a hard ceiling: a body larger than the configured limit is
  # refused rather than buffered.
  defp read_upload(conn) do
    case read_body(conn, length: Storage.max_upload_bytes()) do
      {:ok, body, conn} -> {:ok, body, conn}
      {:more, _partial, _conn} -> {:error, :file_too_large}
      {:error, reason} -> {:error, reason}
    end
  end
end
