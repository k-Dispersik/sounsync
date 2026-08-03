defmodule SoundsyncWeb.UserSocket do
  @moduledoc """
  The single socket for all realtime traffic.

  Authentication happens here rather than in each channel: a socket that
  cannot say who it belongs to has no business opening one. The token is the
  same session token the HTTP API takes, passed as a connect parameter because
  browsers cannot set headers on a WebSocket handshake.
  """

  use Phoenix.Socket

  alias Core.Accounts
  alias Core.Accounts.User

  channel "workspace:*", SoundsyncWeb.WorkspaceChannel
  channel "signaling:*", SoundsyncWeb.SignalingChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) when is_binary(token) do
    case Accounts.get_user_by_session_token(token) do
      %User{} = user -> {:ok, assign(socket, :current_user, user)}
      nil -> :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  # Identifying the socket by user makes it possible to disconnect every
  # session of one person at once, e.g. after a password change.
  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.current_user.id}"
end
