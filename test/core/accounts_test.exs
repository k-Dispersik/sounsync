defmodule Core.AccountsTest do
  use Soundsync.DataCase, async: true

  alias Core.Accounts
  alias Core.DB.User

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
end
