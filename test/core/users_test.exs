defmodule Core.UsersCtxTest do
  use Soundsync.DataCase, async: true

  alias Core.DB.Project
  alias Core.ProjectsCtx.Projects
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

  describe "update/2" do
    test "B-3: renaming a user keeps their project memberships" do
      user = user_fixture()
      project = project_fixture(%{user: user, title: "Kept"})

      assert {:ok, updated} = Users.update(user, %{name: "Renamed"})
      assert updated.name == "Renamed"

      assert [%Project{id: id}] = Repo.preload(user, :projects).projects
      assert id == project.id
    end

    test "B-3: updating a user does not empty the join table" do
      user = user_fixture()
      project_fixture(%{user: user})

      {:ok, _updated} = Users.update(user, %{name: "Renamed"})

      assert Repo.aggregate(from("projects_users", select: 1), :count) == 1
    end
  end

  describe "create_project/2" do
    test "returns the project and makes the user a member" do
      user = user_fixture()

      assert {:ok, %Project{title: "First"} = project} =
               Users.create_project(user, %{title: "First", description: "d"})

      assert [%Project{id: id}] = Repo.preload(user, :projects).projects
      assert id == project.id
    end
  end

  describe "add_member/2" do
    test "adds a user without dropping the existing members" do
      owner = user_fixture()
      guest = user_fixture()
      project = project_fixture(%{user: owner})

      assert {:ok, project} = Projects.add_member(project, guest)

      member_ids = project.users |> Enum.map(& &1.id) |> Enum.sort()
      assert member_ids == Enum.sort([owner.id, guest.id])
    end

    test "adding the same user twice changes nothing" do
      user = user_fixture()
      project = project_fixture(%{user: user})

      assert {:ok, project} = Projects.add_member(project, user)
      assert [%{id: id}] = project.users
      assert id == user.id
    end
  end
end
