defmodule Core.UsersCtx.Users do

  import Ecto.Changeset

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password])
    |> validate_required([:email, :password])
    |> validate_format(:email, ~r/@/)
    |> validate_length(:password, min: 6)

  end

  def create(attrs) do
    %Core.Db.User{}
    |> changeset(attrs)
    |> hash_password()
    |> apply_action(:insert)
  end

  def hash_password(changeset) do
    case changeset do
      %Ecto.Changeset{valid?: true, changes: %{password: password}} ->
        put_change(changeset, :password, :crypto.hash(:sha256, password) |> Base.encode16())
      _ ->
        changeset
    end
  end
end
