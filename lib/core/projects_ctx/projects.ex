defmodule Core.ProjectsCtx.Projects do
  use Core.Helpers, schema: Core.DB.Project

  import Ecto.Changeset

  alias Core.DB.Project
  alias Soundsync.Repo

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:title, :description])
    |> validate_required([:title])
  end

  def create(attrs) do
    %Project{}
    |> changeset(attrs)
    |> apply_action(:insert)
    |> insert_ok?()
  end

  def update(project, attrs) do
    project
    |> changeset(attrs)
    |> apply_action(:update)
    |> update_ok?()
  end

  def list(), do: Project.query() |> Repo.all()

  @doc """
  Lists projects:
  attrs:
    - user_id: filters projects by user association

  """
  def list_by_user(user_id) do
    Project.query()
    |> Project.join_users()
    |> Project.with_user(user_id)
    |> Repo.all()
  end
end
