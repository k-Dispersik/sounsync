defmodule Core.DB.User do
  use Ecto.Schema

  schema "users" do
    field :name, :string
    field :password, :string
    field :email, :string

    has_many :memberships, Core.DB.ProjectMember, on_delete: :delete_all
    many_to_many :projects, Core.DB.Project, join_through: Core.DB.ProjectMember

    timestamps()
  end
end
