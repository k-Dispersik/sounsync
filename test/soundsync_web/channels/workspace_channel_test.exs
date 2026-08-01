defmodule SoundsyncWeb.WorkspaceChannelTest do
  use SoundsyncWeb.ChannelCase, async: true

  alias Core.Accounts
  alias Core.Projects
  alias SoundsyncWeb.UserSocket
  alias SoundsyncWeb.WorkspaceChannel

  setup do
    owner = user_fixture()
    project = project_fixture(%{user: owner})

    %{owner: owner, project: project}
  end

  defp socket_for(user) do
    {:ok, socket} =
      connect(UserSocket, %{"token" => Accounts.create_session_token(user)})

    socket
  end

  describe "join" do
    test "a member gets in and learns the project", %{owner: owner, project: project} do
      assert {:ok, reply, socket} =
               owner
               |> socket_for()
               |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      assert reply.project_id == project.id
      assert is_binary(reply.session_id)
      assert socket.assigns.project_id == project.id
    end

    test "the client may bring its own session id", %{owner: owner, project: project} do
      {:ok, reply, _socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}", %{
          "session_id" => "abc123"
        })

      assert reply.session_id == "abc123"
    end

    test "S-1: a stranger is refused", %{project: project} do
      assert {:error, %{reason: "forbidden"}} =
               user_fixture()
               |> socket_for()
               |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")
    end

    test "a viewer may listen in", %{project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      assert {:ok, _reply, _socket} =
               viewer
               |> socket_for()
               |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")
    end

    test "B-5: a room that does not name a project is refused", %{owner: owner} do
      socket = socket_for(owner)

      for topic <- ["workspace:test-workspace", "workspace:project:", "workspace:project:abc"] do
        assert {:error, %{reason: "invalid_topic"}} =
                 subscribe_and_join(socket, WorkspaceChannel, topic)
      end
    end

    test "a project that does not exist is not found", %{owner: owner} do
      assert {:error, %{reason: "not_found"}} =
               owner
               |> socket_for()
               |> subscribe_and_join(WorkspaceChannel, "workspace:project:999999")
    end
  end

  describe "ping" do
    test "answers with the session id", %{owner: owner, project: project} do
      {:ok, _reply, socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      ref = push(socket, "workspace:ping", %{})

      assert_reply ref, :ok, %{status: "ok"}
    end
  end
end
