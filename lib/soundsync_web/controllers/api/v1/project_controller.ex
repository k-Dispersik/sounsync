defmodule SoundsyncWeb.API.V1.ProjectController do
  use SoundsyncWeb, :controller

  alias Core.ProjectsCtx.Projects

  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Helpers


  def index(conn, _params) do
    projects = Projects.list()

    Enum.map(projects, &JSON.project(&1, :short)) |> Helpers.response(conn, :ok)
  end

  def show(conn, %{"id" => id}) do
    case Projects.get(id, assoc: [tracks: [:clips]]) do
      nil ->
        Helpers.response(%{error: "Project not found"}, conn, :not_found)

      project ->
        JSON.project(project, :detailed) |> Helpers.response(conn, :ok)
    end
  end
end
