defmodule Core.UsersCtxTest do
  use Soundsync.DataCase, async: true

  alias Core.UsersCtx.Users

  defp attrs(email), do: %{name: "Test User", email: email, password: "password123"}

  describe "create/1" do
    test "B-4: rejects a second user with the same email" do
      assert {:ok, _user} = Users.create(attrs("ada@example.com"))
      assert {:error, changeset} = Users.create(attrs("ada@example.com"))

      assert "has already been taken" in errors_on(changeset).email
    end

    test "B-4: treats emails as case-insensitive" do
      assert {:ok, _user} = Users.create(attrs("ada@example.com"))
      assert {:error, changeset} = Users.create(attrs("Ada@Example.com"))

      assert "has already been taken" in errors_on(changeset).email
    end

    test "stores the password hashed" do
      {:ok, user} = Users.create(attrs("hash@example.com"))

      refute user.password == "password123"
      assert Bcrypt.verify_pass("password123", user.password)
    end

    test "requires an email that looks like one" do
      assert {:error, changeset} = Users.create(attrs("not-an-email"))
      assert "has invalid format" in errors_on(changeset).email
    end

    test "requires a password of at least six characters" do
      assert {:error, changeset} =
               Users.create(%{name: "Test User", email: "short@example.com", password: "12345"})

      assert "should be at least 6 character(s)" in errors_on(changeset).password
    end
  end
end
