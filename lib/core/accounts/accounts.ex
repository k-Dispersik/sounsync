defmodule Core.Accounts do
  @moduledoc """
  Accounts context: registering users and checking their credentials.

  The public entry point for everything to do with who a request belongs to.
  Web code talks to this module and never to `Core.UsersCtx.Users` or `Repo`
  directly.
  """

  alias Core.DB.User
  alias Core.DB.UserToken
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

  @doc """
  Issues a session token for the user and returns it base64url-encoded, ready
  to be put in an `Authorization: Bearer` header.
  """
  def create_session_token(%User{} = user) do
    {token, user_token} = UserToken.build_session_token(user)
    Repo.insert!(user_token)
    encode(token)
  end

  @doc """
  Returns the user behind a session token, or `nil` if the token is unknown,
  malformed or older than #{UserToken.session_validity_in_days()} days.
  """
  def get_user_by_session_token(token) when is_binary(token) do
    case decode(token) do
      {:ok, raw} -> raw |> UserToken.verify_session_token_query() |> Repo.one()
      :error -> nil
    end
  end

  def get_user_by_session_token(_token), do: nil

  @doc "Revokes a single session token. Unknown tokens are ignored."
  def delete_session_token(token) when is_binary(token) do
    case decode(token) do
      {:ok, raw} -> raw |> UserToken.by_token_query() |> Repo.delete_all()
      :error -> {0, nil}
    end

    :ok
  end

  @doc "Revokes every session of the user, e.g. after a password change."
  def delete_all_session_tokens(%User{} = user) do
    user |> UserToken.by_user_query() |> Repo.delete_all()
    :ok
  end

  defp encode(raw), do: Base.url_encode64(raw, padding: false)
  defp decode(token), do: Base.url_decode64(token, padding: false)
end
