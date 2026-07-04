defmodule Core.DB.UserToken do
  @moduledoc """
  Session tokens.

  The token is 32 random bytes stored as-is and handed to the client
  base64url-encoded. Storing it raw is fine for a session token: it lives in
  one column with no other meaning, and a stolen database row is already game
  over. Tokens sent by email (password reset, confirmation) would need hashing
  instead, because they also exist in the user's inbox.
  """

  use Ecto.Schema

  import Ecto.Query, only: [from: 2]

  @rand_size 32
  @session_validity_in_days 30

  schema "user_tokens" do
    field :token, :binary
    field :context, :string

    belongs_to :user, Core.DB.User

    timestamps(updated_at: false)
  end

  @doc "How long a session token stays valid."
  def session_validity_in_days, do: @session_validity_in_days

  @doc "Builds a session token and the row that records it."
  def build_session_token(user) do
    token = :crypto.strong_rand_bytes(@rand_size)
    {token, %__MODULE__{token: token, context: "session", user_id: user.id}}
  end

  @doc "Query returning the user a live session token belongs to."
  def verify_session_token_query(token) do
    from t in __MODULE__,
      join: u in assoc(t, :user),
      where: t.token == ^token and t.context == "session",
      where: t.inserted_at > ago(@session_validity_in_days, "day"),
      select: u
  end

  @doc "Query matching a single token row, whatever its age."
  def by_token_query(token) do
    from t in __MODULE__, where: t.token == ^token and t.context == "session"
  end

  @doc "Query matching every session token of a user."
  def by_user_query(user) do
    from t in __MODULE__, where: t.user_id == ^user.id and t.context == "session"
  end
end
