defmodule SoundsyncWeb.ProjectScope do
  @moduledoc """
  Loads a project out of the path and checks the caller's rights on it.

  Every nested resource — tracks, clips, settings — is reached through its
  project, so every one of them needs the same two steps in the same order.
  Doing them together in one call is what keeps a controller from accidentally
  loading a project it never checked.
  """

  alias Core.DB.Project
  alias Core.ProjectsCtx.Policy
  alias Core.ProjectsCtx.Projects

  @spec fetch(Plug.Conn.t(), term(), Policy.action()) ::
          {:ok, Project.t()} | {:error, :not_found | :forbidden}
  def fetch(conn, id, action) do
    with {:ok, project_id} <- cast_id(id),
         {:ok, project} <- load(project_id),
         :ok <- Projects.authorize(action, conn.assigns.current_user, project) do
      {:ok, project}
    end
  end

  @doc "Finds a track inside an already loaded project."
  @spec fetch_track(Project.t(), term()) :: {:ok, Core.DB.Track.t()} | {:error, :not_found}
  def fetch_track(%Project{} = project, id) do
    with {:ok, track_id} <- cast_id(id) do
      case Projects.get_track_by_id(project, track_id) do
        nil -> {:error, :not_found}
        track -> {:ok, track}
      end
    end
  end

  # Path segments are strings, and "abc" must be a 404 rather than a cast error
  # blowing up inside Ecto.
  @spec cast_id(term()) :: {:ok, integer()} | {:error, :not_found}
  def cast_id(id) when is_integer(id), do: {:ok, id}

  def cast_id(id) when is_binary(id) do
    case Integer.parse(id) do
      {parsed, ""} -> {:ok, parsed}
      _ -> {:error, :not_found}
    end
  end

  def cast_id(_id), do: {:error, :not_found}

  defp load(project_id) do
    case Projects.get(project_id, assoc: [tracks: [:clips]]) do
      nil -> {:error, :not_found}
      project -> {:ok, project}
    end
  end
end
