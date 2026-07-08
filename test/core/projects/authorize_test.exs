defmodule Core.ProjectsCtx.AuthorizeTest do
  use Soundsync.DataCase, async: true

  alias Core.ProjectsCtx.Projects

  setup do
    owner = user_fixture()
    project = project_fixture(%{user: owner})

    %{owner: owner, project: project}
  end

  test "the creator is an owner and may do everything", %{owner: owner, project: project} do
    assert Projects.authorize(:read, owner, project) == :ok
    assert Projects.authorize(:write, owner, project) == :ok
    assert Projects.authorize(:delete, owner, project) == :ok
  end

  test "an editor may read and write but not delete", %{project: project} do
    editor = user_fixture()
    {:ok, project} = Projects.add_member(project, editor, :editor)

    assert Projects.authorize(:read, editor, project) == :ok
    assert Projects.authorize(:write, editor, project) == :ok
    assert Projects.authorize(:delete, editor, project) == {:error, :forbidden}
  end

  test "a viewer may only read", %{project: project} do
    viewer = user_fixture()
    {:ok, project} = Projects.add_member(project, viewer, :viewer)

    assert Projects.authorize(:read, viewer, project) == :ok
    assert Projects.authorize(:write, viewer, project) == {:error, :forbidden}
  end

  test "S-1: a stranger may not even read", %{project: project} do
    assert Projects.authorize(:read, user_fixture(), project) == {:error, :forbidden}
  end

  test "a missing user or project is forbidden, not a crash", %{owner: owner, project: project} do
    assert Projects.authorize(:read, nil, project) == {:error, :forbidden}
    assert Projects.authorize(:read, owner, nil) == {:error, :forbidden}
  end
end
