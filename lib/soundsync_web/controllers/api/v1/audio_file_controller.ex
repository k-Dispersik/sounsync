defmodule SoundsyncWeb.API.V1.AudioFileController do
  @moduledoc """
  The audio a project holds: `/v1/projects/:project_id/audio_files`.

  This is the sample library the editor shows. It lists files in every state,
  not only the usable ones, so the UI can say "still processing" instead of
  quietly dropping a file the user just uploaded.
  """

  use SoundsyncWeb, :controller

  alias Core.Storage
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
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
end
