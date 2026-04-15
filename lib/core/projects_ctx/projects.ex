defmodule Core.ProjectsCtx.Projects do
  use Core.Helpers, schema: Core.DB.Project

  import Ecto.Changeset

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:title, :description])
    |> validate_required([:title])
  end

  def create(attrs) do
    %Core.DB.Project{}
    |> changeset(attrs)
    |> apply_action(:insert)
    |> insert_ok?()
  end
end
