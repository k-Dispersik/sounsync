defmodule Core.UsersCtx.Users do
  @moduledoc """
  Users context: changeset, creation, updates and password hashing.
  """

  use Core.Helpers, schema: Core.DB.User

  import Ecto.Changeset

  alias Core.ProjectsCtx.Projects
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

  def update(user, attrs) do
    user
    |> changeset(attrs)
    |> hash_password()
    |> put_assoc(:projects, attrs[:projects] || [])
    |> Repo.update()
  end

  def create_project(user, project_attrs) do
    with {:ok, project} <- Projects.create(project_attrs) do
      user = Repo.preload(user, :projects)
      update(user, %{projects: [project | user.projects]})
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
