defmodule SoundsyncWeb.SignalingChannelTest do
  use SoundsyncWeb.ChannelCase, async: true

  alias Core.Accounts
  alias SoundsyncWeb.SignalingChannel
  alias SoundsyncWeb.UserSocket

  setup do
    owner = user_fixture()
    project = project_fixture(%{user: owner})

    %{owner: owner, project: project}
  end

  defp socket_for(user) do
    {:ok, socket} = connect(UserSocket, %{"token" => Accounts.create_session_token(user)})
    socket
  end

  test "a member joins the signaling room", %{owner: owner, project: project} do
    assert {:ok, _reply, socket} =
             owner
             |> socket_for()
             |> subscribe_and_join(SignalingChannel, "signaling:project:#{project.id}")

    assert socket.assigns.project_id == project.id
  end

  test "S-1: a stranger cannot listen to the signaling of a project", %{project: project} do
    assert {:error, %{reason: "forbidden"}} =
             user_fixture()
             |> socket_for()
             |> subscribe_and_join(SignalingChannel, "signaling:project:#{project.id}")
  end

  test "signals reach the other peers but not the sender", %{owner: owner, project: project} do
    topic = "signaling:project:#{project.id}"
    {:ok, _reply, socket} = owner |> socket_for() |> subscribe_and_join(SignalingChannel, topic)

    push(socket, "signal", %{"to" => "peer-2", "sdp" => "offer"})

    refute_receive %Phoenix.Socket.Message{event: "signal"}
    assert_receive %Phoenix.Socket.Broadcast{event: "signal", payload: %{"sdp" => "offer"}}
  end
end
