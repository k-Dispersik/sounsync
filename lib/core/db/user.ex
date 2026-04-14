defmodule Core.Db.User do
  use Ecto.Schema

  schema "users" do
    field :name, :string
    field :password, :string
    field :email, :string

    timestamps()
  end
end
