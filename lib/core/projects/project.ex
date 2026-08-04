defmodule Core.Projects.Project do
  use Ecto.Schema

  import Ecto.Query

  schema "projects" do
    field :title, :string
    field :description, :string

    embeds_one :settings, Core.Projects.ProjectSetting,
      on_replace: :update,
      defaults_to_struct: true

    has_many :tracks, Core.Projects.Track, on_delete: :delete_all
    has_many :memberships, Core.Projects.ProjectMember, on_delete: :delete_all
    many_to_many :users, Core.Accounts.User, join_through: Core.Projects.ProjectMember

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
