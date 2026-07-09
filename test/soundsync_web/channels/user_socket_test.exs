defmodule SoundsyncWeb.UserSocketTest do
  use SoundsyncWeb.ChannelCase, async: true

  alias Core.Accounts
  alias SoundsyncWeb.UserSocket

  test "S-1: a socket without a token is refused" do
    assert :error = connect(UserSocket, %{})
  end

  test "S-1: an unknown or malformed token is refused" do
    assert :error = connect(UserSocket, %{"token" => "nonsense"})
    assert :error = connect(UserSocket, %{"token" => Base.url_encode64("nope", padding: false)})
    assert :error = connect(UserSocket, %{"token" => 42})
  end

  test "a valid token connects and carries the user" do
    user = user_fixture()
    token = Accounts.create_session_token(user)

    assert {:ok, socket} = connect(UserSocket, %{"token" => token})
    assert socket.assigns.current_user.id == user.id
  end

  test "the socket is identified by its user, so sessions can be cut off" do
    user = user_fixture()
    {:ok, socket} = connect(UserSocket, %{"token" => Accounts.create_session_token(user)})

    assert UserSocket.id(socket) == "user_socket:#{user.id}"
  end

  test "a revoked token stops working" do
    user = user_fixture()
    token = Accounts.create_session_token(user)
    :ok = Accounts.delete_session_token(token)

    assert :error = connect(UserSocket, %{"token" => token})
  end
end
