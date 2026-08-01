defmodule SoundsyncWeb.API.V1.TrackController do
  @moduledoc """
  Tracks of a project: `/v1/projects/:project_id/tracks`.
  """

  use SoundsyncWeb, :controller
  use Params

  alias Core.ProjectsCtx.Projects
  alias Core.ProjectsCtx.Tracks
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams
  alias SoundsyncWeb.ProjectScope

  action_fallback SoundsyncWeb.FallbackController

  defparams(create_track_params(%{row!: :integer}))

  def create(conn, %{"project_id" => project_id} = params) do
    with {:ok, %{row: row}} <- RequestParams.cast(&create_track_params/1, params),
         {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, track} <- Projects.add_track(project, %{row_index: row}) do
      track |> JSON.track() |> Helpers.response(conn, :created)
    end
  end

  def delete(conn, %{"project_id" => project_id, "id" => id}) do
    with {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, track} <- ProjectScope.fetch_track(project, id),
         {:ok, _deleted} <- Tracks.delete(track) do
      send_resp(conn, :no_content, "")
    end
  end
end
