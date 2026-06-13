defmodule SoundsyncWeb.SignalingChannel do
  @moduledoc """
  WebRTC signaling channel: relays offer / answer / ICE between peers.
  """

  use Phoenix.Channel

  require Logger

  @impl true
  def join("signaling:" <> workspace_id, _params, socket) do
    Logger.info("[Signaling:#{workspace_id}] peer joined")
    {:ok, assign(socket, :workspace_id, workspace_id)}
  end

  @impl true
  def handle_in("signal", payload, socket) do
    broadcast_from!(socket, "signal", payload)
    {:noreply, socket}
  end
end
