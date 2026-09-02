defmodule SoundsyncWeb.API.V1.AudioFileController do
  @moduledoc """
  The audio a project holds: `/v1/projects/:project_id/audio_files`.

  This is the sample library the editor shows. It lists files in every state,
  not only the usable ones, so the UI can say "still processing" instead of
  quietly dropping a file the user just uploaded.
  """

  use SoundsyncWeb, :controller

  alias Core.Storage
  alias Core.Storage.Analysis
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams
  alias SoundsyncWeb.ProjectScope

  action_fallback SoundsyncWeb.FallbackController

  def index(conn, %{"project_id" => project_id}) do
    with {:ok, project} <- ProjectScope.fetch(conn, project_id, :read) do
      project
      |> Storage.list_audio_files()
      |> Enum.map(&JSON.audio_file/1)
      |> Helpers.response(conn, :ok)
    end
  end

  @doc """
  The waveform of one file, base64-encoded.

  Kept out of the library listing on purpose: peaks run to about half a
  kilobyte per second of audio, so a project with an hour of material would
  turn its sample list into a two megabyte response.
  """
  def peaks(conn, %{"project_id" => project_id, "id" => id}) do
    with {:ok, project} <- ProjectScope.fetch(conn, project_id, :read),
         {:ok, file_id} <- RequestParams.cast_id(id),
         audio_file when not is_nil(audio_file) <-
           Storage.get_project_audio_file(project, file_id) do
      %{
        peaks: encode_peaks(audio_file.peaks),
        peaks_per_second: Analysis.peaks_per_second(),
        duration_ms: audio_file.duration_ms
      }
      |> Helpers.response(conn, :ok)
    else
      nil -> {:error, :not_found, "No such audio file in this project"}
      error -> error
    end
  end

  @doc """
  The audio itself.

  Served by this controller rather than straight off disk: a file is only
  readable by people who can read its project, and a static route cannot ask
  that question. In production the client gets a presigned URL and never comes
  here at all.
  """
  # sobelow_skip ["XSS.ContentType", "XSS.SendResp"]
  # The content type is constrained to the audio allow-list by
  # `safe_content_type/1`, and the body is the stored file, not request data.
  def content(conn, %{"project_id" => project_id, "id" => id}) do
    with {:ok, project} <- ProjectScope.fetch(conn, project_id, :read),
         {:ok, file_id} <- RequestParams.cast_id(id),
         audio_file when not is_nil(audio_file) <-
           Storage.get_project_audio_file(project, file_id),
         {:ok, bytes} <- Storage.read(audio_file.storage_key) do
      conn
      |> put_resp_content_type(safe_content_type(audio_file.content_type))
      |> put_resp_header("cache-control", "private, max-age=3600")
      |> put_resp_header("x-content-type-options", "nosniff")
      |> send_resp(200, bytes)
    else
      nil -> {:error, :not_found, "No such audio file in this project"}
      {:error, :enoent} -> {:error, :upload_missing}
      error -> error
    end
  end

  # The stored content type was claimed by whoever uploaded the file. Echoing it
  # back would let someone store `text/html` and have the browser render their
  # bytes as a page on our origin; the upload check makes that unlikely, not
  # impossible. Only types we play are ever sent, and never sniffed.
  defp safe_content_type(content_type) do
    if content_type in Storage.allowed_content_types(),
      do: content_type,
      else: "application/octet-stream"
  end

  # A file that has not been analysed has no waveform yet; that is a fact worth
  # sending, so the client can draw a placeholder instead of an empty box.
  defp encode_peaks(nil), do: nil
  defp encode_peaks(peaks), do: Base.encode64(peaks)
end
