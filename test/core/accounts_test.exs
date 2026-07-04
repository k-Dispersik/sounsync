defmodule Core.AccountsTest do
  use Soundsync.DataCase, async: true

  alias Core.Accounts
  alias Core.DB.User
  alias Core.DB.UserToken

  @password "password123"

  defp register(email) do
    {:ok, user} = Accounts.register_user(%{name: "Test User", email: email, password: @password})
    user
  end

  describe "register_user/1" do
    test "creates a user with a hashed password" do
      user = register("ada@example.com")

      refute user.password == @password
      assert Bcrypt.verify_pass(@password, user.password)
    end

    test "refuses an email that is already taken" do
      register("ada@example.com")

      assert {:error, changeset} =
               Accounts.register_user(%{
                 name: "Other",
                 email: "ADA@example.com",
                 password: @password
               })

      assert "has already been taken" in errors_on(changeset).email
    end
  end

  describe "authenticate/2" do
    test "returns the user for the right password" do
      user = register("ada@example.com")

      assert {:ok, %User{id: id}} = Accounts.authenticate("ada@example.com", @password)
      assert id == user.id
    end

    test "matches the email case-insensitively" do
      register("ada@example.com")

      assert {:ok, %User{}} = Accounts.authenticate("Ada@Example.com", @password)
    end

    test "rejects a wrong password" do
      register("ada@example.com")

      assert {:error, :invalid_credentials} = Accounts.authenticate("ada@example.com", "wrong")
    end

    test "rejects an unknown email with the same answer" do
      assert {:error, :invalid_credentials} =
               Accounts.authenticate("nobody@example.com", @password)
    end

    test "S-1: an unknown email costs about as much time as a known one" do
      register("ada@example.com")

      {known, _} = :timer.tc(fn -> Accounts.authenticate("ada@example.com", "wrong") end)
      {unknown, _} = :timer.tc(fn -> Accounts.authenticate("nobody@example.com", "wrong") end)

      # A missing bcrypt round would make the unknown case orders of magnitude
      # faster; anything within 3x is noise on a loaded machine.
      assert unknown * 3 > known
    end

    test "does not blow up on non-string input" do
      assert {:error, :invalid_credentials} = Accounts.authenticate(nil, @password)
      assert {:error, :invalid_credentials} = Accounts.authenticate("ada@example.com", nil)
    end
  end

  describe "session tokens" do
    test "a fresh token resolves back to its user" do
      user = register("ada@example.com")

      token = Accounts.create_session_token(user)

      assert %User{id: id} = Accounts.get_user_by_session_token(token)
      assert id == user.id
    end

    test "every token is different" do
      user = register("ada@example.com")

      refute Accounts.create_session_token(user) == Accounts.create_session_token(user)
    end

    test "an unknown, malformed or empty token resolves to nobody" do
      register("ada@example.com")

      assert Accounts.get_user_by_session_token("not-base64!!") == nil
      assert Accounts.get_user_by_session_token(Base.url_encode64("nonsense")) == nil
      assert Accounts.get_user_by_session_token("") == nil
      assert Accounts.get_user_by_session_token(nil) == nil
    end

    test "a token older than the validity window is refused" do
      user = register("ada@example.com")
      token = Accounts.create_session_token(user)

      expire_tokens(user, UserToken.session_validity_in_days() + 1)

      assert Accounts.get_user_by_session_token(token) == nil
    end

    test "a token just inside the validity window still works" do
      user = register("ada@example.com")
      token = Accounts.create_session_token(user)

      expire_tokens(user, UserToken.session_validity_in_days() - 1)

      assert %User{} = Accounts.get_user_by_session_token(token)
    end

    test "delete_session_token/1 revokes only that token" do
      user = register("ada@example.com")
      kept = Accounts.create_session_token(user)
      revoked = Accounts.create_session_token(user)

      assert :ok = Accounts.delete_session_token(revoked)

      assert Accounts.get_user_by_session_token(revoked) == nil
      assert %User{} = Accounts.get_user_by_session_token(kept)
    end

    test "delete_all_session_tokens/1 logs the user out everywhere" do
      user = register("ada@example.com")
      first = Accounts.create_session_token(user)
      second = Accounts.create_session_token(user)

      assert :ok = Accounts.delete_all_session_tokens(user)

      assert Accounts.get_user_by_session_token(first) == nil
      assert Accounts.get_user_by_session_token(second) == nil
    end

    test "deleting a user takes their tokens with them" do
      user = register("ada@example.com")
      token = Accounts.create_session_token(user)

      Repo.delete!(user)

      assert Accounts.get_user_by_session_token(token) == nil
      assert Repo.aggregate(UserToken, :count) == 0
    end
  end

  defp expire_tokens(user, days) do
    moment = DateTime.utc_now() |> DateTime.add(-days, :day) |> DateTime.to_naive()

    user
    |> UserToken.by_user_query()
    |> Repo.update_all(set: [inserted_at: moment])
  end
end
