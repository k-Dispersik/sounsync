defmodule SoundsyncWeb.ProjectTopic do
  @moduledoc """
  Resolves the `project:<id>` part of a channel topic and decides whether the
  joining user may be in that room.

  Both realtime channels answer the same question, and answering it in one
  place is what keeps them from drifting apart: a room whose name does not
  name a project cannot be authorised at all, so it is refused outright.
  """

  alias Core.Accounts.User
  alias Core.DB.Project
  alias Core.Projects

  @type reason :: :invalid_topic | :not_found | :forbidden

  @spec authorize(String.t(), User.t() | nil) :: {:ok, Project.t()} | {:error, reason()}
  def authorize("project:" <> id, %User{} = user) do
    with {:ok, project_id} <- parse_id(id),
         %Project{} = project <- Projects.get_project(project_id),
         :ok <- Projects.authorize(:read, user, project) do
      {:ok, project}
    else
      nil -> {:error, :not_found}
      :error -> {:error, :invalid_topic}
      {:error, reason} -> {:error, reason}
    end
  end

  def authorize(_topic, _user), do: {:error, :invalid_topic}

  defp parse_id(id) do
    case Integer.parse(id) do
      {project_id, ""} -> {:ok, project_id}
      _ -> :error
    end
  end
end
