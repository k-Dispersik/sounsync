defmodule SoundsyncWeb.SignalingChannel do
  @moduledoc """
  WebRTC signaling channel: relays offer / answer / ICE between peers.
  """

  use Phoenix.Channel

  alias SoundsyncWeb.ProjectTopic

  require Logger

  @impl true
  def join("signaling:" <> workspace_id, _params, socket) do
    case ProjectTopic.authorize(workspace_id, socket.assigns.current_user) do
      {:ok, project} ->
        Logger.info("[Signaling:#{workspace_id}] peer joined")

        {:ok,
         socket
         |> assign(:workspace_id, workspace_id)
         |> assign(:project_id, project.id)}

      {:error, reason} ->
        {:error, %{reason: to_string(reason)}}
    end
  end

  @impl true
  def handle_in("signal", payload, socket) do
    broadcast_from!(socket, "signal", payload)
    {:noreply, socket}
  end
end
