defmodule Core.DB.User do
  use Ecto.Schema

  schema "users" do
    field :name, :string
    field :password, :string
    field :email, :string

    many_to_many :projects, Core.DB.Project, join_through: "projects_users", on_delete: :delete_all

    timestamps()
  end
end
