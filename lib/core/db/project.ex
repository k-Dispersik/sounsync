defmodule Core.DB.Project do
  use Ecto.Schema
  import Ecto.Query


  schema "projects" do
    field :title, :string
    field :description, :string

    many_to_many :users, Core.DB.User, join_through: "projects_users", on_delete: :delete_all

    timestamps()
  end

  def query, do: from(__MODULE__, as: :project)

  def join_users(query) do
    join(query, :inner, [project: p], u in assoc(p, :users), as: :user)
  end

  def with_user(query, user_id) do
    where(query, [project: p, user: u], u.id == ^user_id)
  end
end
