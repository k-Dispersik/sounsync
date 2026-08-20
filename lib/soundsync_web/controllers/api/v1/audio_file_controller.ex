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

  # A file that has not been analysed has no waveform yet; that is a fact worth
  # sending, so the client can draw a placeholder instead of an empty box.
  defp encode_peaks(nil), do: nil
  defp encode_peaks(peaks), do: Base.encode64(peaks)
end
