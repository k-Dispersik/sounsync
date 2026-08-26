defmodule SoundsyncWeb.WorkspaceChannelTest do
  use SoundsyncWeb.ChannelCase, async: true

  import Ecto.Query, only: [from: 2]

  alias Core.Accounts
  alias Core.Projects
  alias Core.Projects.Clip
  alias Core.Projects.Track
  alias Soundsync.Repo
  alias SoundsyncWeb.Presence
  alias SoundsyncWeb.UserSocket
  alias SoundsyncWeb.WorkspaceChannel

  setup do
    owner = user_fixture()
    project = project_fixture(%{user: owner})

    %{owner: owner, project: project}
  end

  defp version(project), do: Projects.get_project(project.id).version

  defp socket_for(user) do
    {:ok, socket} =
      connect(UserSocket, %{"token" => Accounts.create_session_token(user)})

    socket
  end

  describe "join" do
    test "a member gets in and is handed the whole project", ctx do
      %{owner: owner, project: project} = ctx
      track = track_fixture(project)
      clip_fixture(track, %{title: "Kick"})

      assert {:ok, reply, socket} =
               owner
               |> socket_for()
               |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      assert reply.project.id == project.id
      assert [%{clips: [%{title: "Kick"}]}] = reply.project.tracks
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

  describe "operations" do
    setup %{owner: owner, project: project} do
      {:ok, _reply, socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      track = track_fixture(project, %{row_index: 0})
      clip = clip_fixture(track, %{title: "Kick", start_time: 0})

      %{socket: socket, track: track, clip: clip}
    end

    test "an edit is written down and passed on to the others", ctx do
      %{socket: socket, project: project, track: track, clip: clip} = ctx

      ref =
        push(socket, "op", %{
          "type" => "clip.move",
          "client_id" => "abc",
          "base_version" => version(project),
          "payload" => %{"clip_id" => clip.id, "track_id" => track.id, "start_time" => 4_000}
        })

      assert_reply ref, :ok, %{type: "clip.move", version: 1, payload: %{start_time: 4_000}}
      assert_broadcast "op", %{type: "clip.move", client_id: "abc"}
      assert Repo.get(Clip, clip.id).start_time == 4_000
    end

    test "B-6: the author does not receive their own edit back", ctx do
      %{socket: socket, project: project} = ctx

      ref =
        push(socket, "op", %{
          "type" => "track.create",
          "base_version" => version(project),
          "payload" => %{"row_index" => 3}
        })

      assert_reply ref, :ok, _payload

      # The broadcast went to the topic, but not down this socket.
      assert_broadcast "op", %{type: "track.create"}
      refute_receive %Phoenix.Socket.Message{event: "op"}
      assert Repo.aggregate(from(t in Track, where: t.project_id == ^project.id), :count) == 2
    end

    test "a viewer's edit is refused and nothing is written", %{project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      {:ok, _reply, socket} =
        viewer
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      ref =
        push(socket, "op", %{
          "type" => "track.create",
          "base_version" => version(project),
          "payload" => %{"row_index" => 9}
        })

      assert_reply ref, :error, %{reason: "forbidden"}
      refute_broadcast "op", %{type: "track.create"}
    end

    test "an invalid payload comes back with the field that is wrong", ctx do
      %{socket: socket, project: project} = ctx

      ref =
        push(socket, "op", %{
          "type" => "clip.create",
          "base_version" => version(project),
          "payload" => %{}
        })

      assert_reply ref, :error, %{reason: "invalid", details: details}
      assert details.start_time
      refute_broadcast "op", _payload
    end

    test "an unknown operation is refused", ctx do
      %{socket: socket, project: project} = ctx

      ref =
        push(socket, "op", %{
          "type" => "project.nuke",
          "base_version" => version(project),
          "payload" => %{}
        })

      assert_reply ref, :error, %{reason: "unknown_operation"}
    end

    test "a message without a type is refused", %{socket: socket} do
      ref = push(socket, "op", %{"payload" => %{}})

      assert_reply ref, :error, %{reason: "invalid"}
    end

    test "editing something from another project is not found", ctx do
      %{socket: socket, project: project} = ctx
      foreign = project_fixture() |> track_fixture()

      ref =
        push(socket, "op", %{
          "type" => "track.delete",
          "base_version" => version(project),
          "payload" => %{"track_id" => foreign.id}
        })

      assert_reply ref, :error, %{reason: "not_found"}
      assert Repo.get(Track, foreign.id)
    end

    test "settings travel as an operation too", ctx do
      %{socket: socket, project: project} = ctx

      ref =
        push(socket, "op", %{
          "type" => "project.settings.update",
          "base_version" => version(project),
          "payload" => %{"bpm" => 90}
        })

      assert_reply ref, :ok, %{type: "project.settings.update", payload: %{settings: settings}}
      assert settings.bpm == 90
      assert Projects.get_project(project.id).settings.bpm == 90
    end
  end

  describe "versions" do
    setup %{owner: owner, project: project} do
      {:ok, _reply, socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      %{socket: socket}
    end

    test "the snapshot says which version it is", ctx do
      %{owner: owner, project: project} = ctx

      {:ok, reply, _socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      assert reply.project.version == 0
    end

    test "an edit built on an old version comes back with a fresh snapshot", ctx do
      %{socket: socket, project: project} = ctx

      ref =
        push(socket, "op", %{
          "type" => "track.create",
          "base_version" => 0,
          "payload" => %{"row_index" => 1}
        })

      assert_reply ref, :ok, %{version: 1}

      stale =
        push(socket, "op", %{
          "type" => "track.create",
          "base_version" => 0,
          "payload" => %{"row_index" => 2}
        })

      assert_reply stale, :error, %{reason: "stale", project: snapshot}
      assert snapshot.version == 1
      assert length(snapshot.tracks) == 1
      assert Projects.get_project(project.id).version == 1
    end

    test "an edit without a version is refused", %{socket: socket} do
      ref = push(socket, "op", %{"type" => "track.create", "payload" => %{"row_index" => 1}})

      assert_reply ref, :error, %{reason: "missing_base_version"}
    end
  end

  describe "two participants" do
    setup %{owner: owner, project: project} do
      editor = user_fixture()
      {:ok, _} = Projects.add_member(project, editor, :editor)
      topic = "workspace:project:#{project.id}"

      {:ok, _reply, author} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, topic, %{
          "session_id" => "author"
        })

      {:ok, _reply, peer} =
        editor
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, topic, %{
          "session_id" => "peer"
        })

      %{author: author, peer: peer, editor: editor}
    end

    test "an edit by one reaches the other", ctx do
      %{author: author, project: project} = ctx

      ref =
        push(author, "op", %{
          "type" => "track.create",
          "client_id" => "author",
          "base_version" => version(project),
          "payload" => %{"row_index" => 5}
        })

      assert_reply ref, :ok, %{version: 1}

      assert_push "op", %{
        type: "track.create",
        client_id: "author",
        version: 1,
        payload: %{row_index: 5}
      }
    end

    test "the change is in the database by the time the other hears about it", ctx do
      %{author: author, project: project} = ctx

      push(author, "op", %{
        "type" => "track.create",
        "base_version" => version(project),
        "payload" => %{"row_index" => 6}
      })

      assert_push "op", %{payload: %{id: track_id}}

      # Broadcasting before persisting would show the peer a track that does
      # not exist; asserting on the row here is what rules that order out.
      assert Repo.get(Track, track_id)
    end

    test "a peer joining later is handed everything that happened before", ctx do
      %{author: author, project: project, owner: owner} = ctx

      ref =
        push(author, "op", %{
          "type" => "track.create",
          "base_version" => version(project),
          "payload" => %{"row_index" => 7}
        })

      assert_reply ref, :ok, _payload

      {:ok, reply, _late} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}", %{
          "session_id" => "late"
        })

      assert reply.project.version == 1
      assert [%{row_index: 7}] = reply.project.tracks
    end

    test "an edit refused for one participant reaches nobody", ctx do
      %{project: project, peer: peer} = ctx
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      {:ok, _reply, watcher} =
        viewer
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}", %{
          "session_id" => "watcher"
        })

      ref =
        push(watcher, "op", %{
          "type" => "track.create",
          "base_version" => version(project),
          "payload" => %{"row_index" => 8}
        })

      assert_reply ref, :error, %{reason: "forbidden"}
      refute_receive %Phoenix.Socket.Message{event: "op"}
      assert peer
    end

    test "two edits on the same version: the second is told to resync", ctx do
      %{author: author, peer: peer, project: project} = ctx
      base = version(project)

      first =
        push(author, "op", %{
          "type" => "track.create",
          "base_version" => base,
          "payload" => %{"row_index" => 1}
        })

      assert_reply first, :ok, %{version: 1}

      second =
        push(peer, "op", %{
          "type" => "track.create",
          "base_version" => base,
          "payload" => %{"row_index" => 2}
        })

      assert_reply second, :error, %{reason: "stale", project: snapshot}
      assert snapshot.version == 1
      assert Repo.aggregate(from(t in Track, where: t.project_id == ^project.id), :count) == 1
    end

    test "both participants show up in presence", ctx do
      %{project: project} = ctx

      participants = Presence.list("workspace:project:#{project.id}")

      assert Map.keys(participants) |> Enum.sort() == ["author", "peer"]
    end
  end

  describe "presence" do
    test "the joining client is in the list it is handed", ctx do
      %{owner: owner, project: project} = ctx

      {:ok, _reply, _socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}", %{
          "session_id" => "tab-one"
        })

      assert_push "presence_state", state
      assert %{metas: [meta]} = state["tab-one"]
      assert meta.user_id == owner.id
      assert meta.name == owner.name
    end

    test "two tabs of the same person are two participants", ctx do
      %{owner: owner, project: project} = ctx
      topic = "workspace:project:#{project.id}"

      {:ok, _reply, _first} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, topic, %{
          "session_id" => "tab-one"
        })

      assert_push "presence_state", _state

      {:ok, _reply, _second} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, topic, %{
          "session_id" => "tab-two"
        })

      assert_push "presence_state", state
      assert Map.keys(state) |> Enum.sort() == ["tab-one", "tab-two"]
    end

    test "everyone sees the same colour for the same person", ctx do
      %{owner: owner, project: project} = ctx

      {:ok, _reply, _socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, "workspace:project:#{project.id}")

      assert_push "presence_state", state
      [%{metas: [meta]}] = Map.values(state)

      assert meta.color_hue == Presence.meta(owner, "any").color_hue
      assert meta.color_hue in 0..359
    end

    test "leaving takes the participant out of the list", ctx do
      %{owner: owner, project: project} = ctx
      topic = "workspace:project:#{project.id}"

      {:ok, _reply, socket} =
        owner
        |> socket_for()
        |> subscribe_and_join(WorkspaceChannel, topic, %{
          "session_id" => "tab-one"
        })

      assert_push "presence_state", _state
      Process.unlink(socket.channel_pid)
      :ok = close(socket)

      assert Presence.list(topic) == %{}
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
