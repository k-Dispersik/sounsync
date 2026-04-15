defmodule Core.DB.Project do
  use Ecto.Schema


  schema "projects" do
    field :title, :string
    field :description, :string

    many_to_many :users, Core.DB.User, join_through: "projects_users", on_delete: :delete_all

    timestamps()
  end
end
