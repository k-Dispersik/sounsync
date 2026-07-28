defmodule SoundsyncWeb.API.V1.TrackController do
  @moduledoc """
  Tracks of a project: `/v1/projects/:project_id/tracks`.
  """

  use SoundsyncWeb, :controller

  alias Core.ProjectsCtx.Projects
  alias Core.ProjectsCtx.Tracks
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.ProjectScope

  action_fallback SoundsyncWeb.FallbackController

  def create(conn, %{"project_id" => project_id, "row" => row}) do
    with {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, track} <- Projects.add_track(project, %{row_index: row}) do
      track |> JSON.track() |> Helpers.response(conn, :created)
    end
  end

  def create(_conn, _params), do: {:error, :invalid_params, "row is required"}

  def delete(conn, %{"project_id" => project_id, "id" => id}) do
    with {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, track} <- ProjectScope.fetch_track(project, id),
         {:ok, _deleted} <- Tracks.delete(track) do
      send_resp(conn, :no_content, "")
    end
  end
end
