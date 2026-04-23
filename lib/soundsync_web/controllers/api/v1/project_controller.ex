defmodule SoundsyncWeb.API.V1.ProjectController do
  use SoundsyncWeb, :controller

  alias Core.ProjectsCtx.Projects
  alias Core.ProjectsCtx.Tracks

  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Helpers

  require OK

  def index(conn, _params) do
    projects = Projects.list()

    Enum.map(projects, &JSON.project(&1, :short)) |> Helpers.response(conn, :ok)
  end

  def show(conn, %{"id" => id}) do
    OK.try do
      project <- Projects.get(id, assoc: [tracks: [:clips]]) |> OK.required()
    after
      JSON.project(project, :detailed) |> Helpers.response(conn, :ok)
    rescue
      _e -> Helpers.response(%{error: "Project not found"}, conn, :not_found)
    end
  end

  def create_project(conn, %{"title" => title, "description" => description}) do
    OK.try do
      project <- Projects.create(%{title: title, description: description})
    after
      JSON.project(project, :detailed) |> Helpers.response(conn, :created)
    rescue
      e -> Helpers.response(%{error: e}, conn, :bad_request)
    end
  end

  def create_track(conn, %{"project_id" => project_id, "row" => row}) do
    OK.try do
      project <- Projects.get(project_id, assoc: [tracks: [:clips]]) |> OK.required()
      track <- Projects.add_track(project, %{row_index: row})
    after
      JSON.track(track) |> Helpers.response(conn, :created)
    rescue
      e -> Helpers.response(%{error: e}, conn, :bad_request)
    end
  end

  def create_clip(conn, %{"project_id" => project_id, "track_id" => track_id}) do
    OK.try do
      project <- Projects.get(project_id, assoc: [tracks: [:clips]]) |> OK.required()
      track <- Projects.get_track_by_id(project, track_id) |> OK.required()
      clip <- Tracks.add_clip(track, track)
    after
      JSON.clip(clip) |> Helpers.response(conn, :created)
    rescue
      e -> Helpers.response(%{error: e}, conn, :bad_request)
    end
  end
end
