defmodule Core.Projects.ProjectMember do
  @moduledoc """
  Membership of a user in a project, with the role that decides what they may
  do. Roles are ordered from most to least powerful:

    * `:owner` — full control, including deleting the project
    * `:editor` — may change tracks, clips and settings
    * `:viewer` — read only
  """

  use Ecto.Schema

  import Ecto.Changeset

  @roles [:owner, :editor, :viewer]

  schema "project_members" do
    field :role, Ecto.Enum, values: @roles, default: :editor

    belongs_to :project, Core.Projects.Project
    belongs_to :user, Core.Accounts.User

    timestamps()
  end

  @doc "All roles, most powerful first."
  def roles, do: @roles

  def changeset(member, attrs) do
    member
    |> cast(attrs, [:project_id, :user_id, :role])
    |> validate_required([:project_id, :user_id, :role])
    |> foreign_key_constraint(:project_id)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint([:project_id, :user_id])
  end
end
