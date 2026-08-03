defmodule Core.Accounts.User do
  @moduledoc """
  A person with an account. `password` holds the bcrypt hash, never the
  password itself — see `Core.Accounts.register_user/1`.
  """

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
