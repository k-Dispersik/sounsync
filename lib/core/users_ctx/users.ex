defmodule Core.UsersCtx.Users do
  @moduledoc """
  Users context: changeset, creation, updates and password hashing.
  """

  use Core.Helpers, schema: Core.DB.User

  import Ecto.Changeset

  alias Core.Projects
  alias Soundsync.Repo

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :password])
    |> validate_required([:email, :password])
    |> validate_length(:name, min: 3)
    |> validate_format(:email, ~r/@/)
    |> validate_length(:password, min: 6)
    |> unique_constraint(:email)
  end

  def create(attrs) do
    %Core.DB.User{}
    |> changeset(attrs)
    |> hash_password()
    |> Repo.insert()
  end

  @doc """
  Updates the user's own fields.

  Membership in projects is deliberately not touched here: this function used
  to `put_assoc(:projects, ...)`, so renaming a user wiped every project they
  belonged to. Membership is managed by `Core.Projects.add_member/2`.
  """
  def update(user, attrs) do
    user
    |> changeset(attrs)
    |> hash_password()
    |> Repo.update()
  end

  @doc "Creates a project and makes the user its owner."
  def create_project(user, project_attrs) do
    with {:ok, project} <- Projects.create_project(project_attrs) do
      Projects.add_member(project, user, :owner)
    end
  end

  defp hash_password(changeset) do
    case changeset do
      %Ecto.Changeset{valid?: true, changes: %{password: password}} ->
        put_change(changeset, :password, Bcrypt.hash_pwd_salt(password))

      _ ->
        changeset
    end
  end
end
