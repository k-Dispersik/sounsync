defmodule SoundsyncWeb.ProjectScope do
  @moduledoc """
  Loads a project out of the path and checks the caller's rights on it.

  Every nested resource — tracks, clips, settings — is reached through its
  project, so every one of them needs the same two steps in the same order.
  Doing them together in one call is what keeps a controller from accidentally
  loading a project it never checked.
  """

  alias Core.Projects
  alias Core.Projects.Policy
  alias Core.Projects.Project
  alias SoundsyncWeb.Params

  @spec fetch(Plug.Conn.t(), term(), Policy.action()) ::
          {:ok, Project.t()} | {:error, :not_found | :forbidden}
  def fetch(conn, id, action) do
    with {:ok, project_id} <- Params.cast_id(id),
         {:ok, project} <- load(project_id),
         :ok <- Projects.authorize(action, conn.assigns.current_user, project) do
      {:ok, project}
    end
  end

  @doc "Finds a track inside an already loaded project."
  @spec fetch_track(Project.t(), term()) :: {:ok, Core.Projects.Track.t()} | {:error, :not_found}
  def fetch_track(%Project{} = project, id) do
    with {:ok, track_id} <- Params.cast_id(id) do
      case Projects.get_track(project, track_id) do
        nil -> {:error, :not_found}
        track -> {:ok, track}
      end
    end
  end

  defp load(project_id) do
    case Projects.get_project(project_id, assoc: [tracks: [:clips]]) do
      nil -> {:error, :not_found}
      project -> {:ok, project}
    end
  end
end
