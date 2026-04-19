defmodule SoundsyncWeb.API.V1.ProjectController do
  use SoundsyncWeb, :controller

  alias Core.ProjectsCtx.Projects

  def index(conn, _params) do
    projects = Projects.list()

    json(conn, Enum.map(projects, fn project ->
      %{
        id: project.id,
        title: project.title,
        description: project.description
      }
    end))
  end

  def show(conn, %{"id" => id}) do
    case Projects.get(id, assoc: [tracks: [:clips]]) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Project not found"})

      project ->
        json(conn, %{
          id: project.id,
          title: project.title,
          description: project.description,
          tracks: Enum.map(project.tracks, fn track ->
            %{
              id: track.id,
              title: track.title,
              row_index: track.row_index,
              category: track.category,
              clips: Enum.map(track.clips, fn clip ->
                %{
                  id: clip.id,
                  start_time: clip.start_time,
                  duration: clip.duration,
                  settings: clip.settings,
                  file_path: clip.file_path
                }
              end)
            }
          end)
        })
    end
  end
end
