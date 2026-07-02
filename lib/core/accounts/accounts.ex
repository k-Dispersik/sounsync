defmodule Core.Accounts do
  @moduledoc """
  Accounts context: registering users and checking their credentials.

  The public entry point for everything to do with who a request belongs to.
  Web code talks to this module and never to `Core.UsersCtx.Users` or `Repo`
  directly.
  """

  alias Core.DB.User
  alias Core.UsersCtx.Users
  alias Soundsync.Repo

  @doc """
  Registers a user. Returns `{:error, changeset}` on invalid data or on an
  email that is already taken.
  """
  def register_user(attrs), do: Users.create(attrs)

  @doc "Fetches a user by email. Matching is case-insensitive (citext column)."
  def get_user_by_email(email) when is_binary(email), do: Repo.get_by(User, email: email)

  @doc "Fetches a user by id, or `nil`."
  def get_user(id), do: Repo.get(User, id)

  @doc """
  Checks an email and password pair.

  Returns `{:error, :invalid_credentials}` for both a wrong password and an
  unknown email — telling them apart would let anyone enumerate accounts. For
  the same reason an unknown email still burns a bcrypt round: without it the
  answer comes back an order of magnitude faster and the timing gives it away.
  """
  def authenticate(email, password) when is_binary(email) and is_binary(password) do
    case get_user_by_email(email) do
      nil ->
        Bcrypt.no_user_verify()
        {:error, :invalid_credentials}

      user ->
        if Bcrypt.verify_pass(password, user.password),
          do: {:ok, user},
          else: {:error, :invalid_credentials}
    end
  end

  def authenticate(_email, _password), do: {:error, :invalid_credentials}
end
