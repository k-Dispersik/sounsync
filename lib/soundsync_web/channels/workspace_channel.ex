defmodule SoundsyncWeb.WorkspaceChannel do
  use Phoenix.Channel

  require Logger

  @impl true
  def join("workspace:" <> workspace_id, params, socket) do
    session_id = Map.get(params, "session_id") || generate_session_id()

    socket =
      socket
      |> assign(:workspace_id, workspace_id)
      |> assign(:session_id, session_id)

    {:ok, %{workspace_id: workspace_id, session_id: session_id}, socket}
  end

  @impl true
  def handle_in("workspace:ping", _payload, socket) do
    {:reply, {:ok, %{status: "ok", session_id: socket.assigns.session_id}}, socket}
  end

  @impl true
  def terminate(reason, socket) do
    Logger.info(
      "[Workspace:#{socket.assigns.workspace_id}] Session #{socket.assigns.session_id} left: #{inspect(reason)}"
    )

    :ok
  end

  defp generate_session_id,
    do: :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
end
