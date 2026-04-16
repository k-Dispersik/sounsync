defmodule SoundsyncWeb.API.V1.ProjectController do
  use SoundsyncWeb, :controller

  alias Core.ProjectsCtx.Projects

  def list(conn, _params) do
    projects = Projects.list()

    json(conn, Enum.map(projects, fn project ->
      %{
        id: project.id,
        title: project.title,
        description: project.description
      }
    end))
  end
end
