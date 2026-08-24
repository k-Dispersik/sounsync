defmodule SoundsyncWeb.WorkspaceChannel do
  @moduledoc """
  The workspace channel: everything that changes a project travels through here.

  Edits used to go over an unreliable WebRTC data channel, where a dropped
  packet meant two people quietly disagreeing about what the project contained.
  A dropped cursor position costs sixteen milliseconds; a dropped "clip
  created" costs the project. So edits go over the socket — ordered, delivered,
  authorised and written down — and only ephemeral things stay on WebRTC.

  Joining hands back the whole project rather than a log to replay: the project
  is kilobytes, and replacing state wholesale is the one reconnection strategy
  with no way to end up half-applied.
  """

  use Phoenix.Channel

  alias Core.Projects
  alias Core.Projects.Clip
  alias Core.Projects.Operation
  alias Core.Projects.Project
  alias Core.Projects.Track
  alias SoundsyncWeb.ErrorResponse
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.ProjectTopic

  require Logger

  @impl true
  def join("workspace:" <> workspace_id, params, socket) do
    case ProjectTopic.authorize(workspace_id, socket.assigns.current_user) do
      {:ok, project} ->
        session_id = Map.get(params, "session_id") || generate_session_id()

        socket =
          socket
          |> assign(:workspace_id, workspace_id)
          |> assign(:project_id, project.id)
          |> assign(:session_id, session_id)

        {:ok, %{workspace_id: workspace_id, session_id: session_id, project: snapshot(project)},
         socket}

      {:error, reason} ->
        {:error, %{reason: to_string(reason)}}
    end
  end

  @impl true
  def handle_in("op", %{"type" => type} = message, socket) do
    project = load_project(socket)
    payload = Map.get(message, "payload", %{})

    case Operation.apply(project, socket.assigns.current_user, type, payload) do
      {:ok, event} ->
        broadcast_event(socket, event, message)
        {:reply, {:ok, event_payload(event)}, socket}

      {:error, reason} ->
        {:reply, {:error, describe(reason)}, socket}
    end
  end

  def handle_in("op", _message, socket) do
    {:reply, {:error, %{reason: "invalid", details: %{type: ["is required"]}}}, socket}
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

  # The author already applied the change optimistically; sending it back would
  # only give them a chance to apply it twice.
  defp broadcast_event(socket, event, message) do
    broadcast_from!(
      socket,
      "op",
      Map.put(event_payload(event), :client_id, Map.get(message, "client_id"))
    )
  end

  defp event_payload(%{type: type, data: data}), do: %{type: type, payload: serialise(data)}

  defp serialise(%Clip{} = clip), do: JSON.clip(clip)
  defp serialise(%Track{} = track), do: JSON.track(track)
  defp serialise(%Project{} = project), do: JSON.project(project, :summary)
  defp serialise(data) when is_map(data), do: data

  # Reloaded with its tracks and clips: the topic check only needs the project
  # row, but a snapshot without the timeline is not a snapshot.
  defp snapshot(%Project{} = project) do
    project.id
    |> Projects.get_project(assoc: [tracks: [:clips]])
    |> JSON.project(:full)
  end

  defp load_project(socket) do
    Projects.get_project(socket.assigns.project_id, assoc: [tracks: [:clips]])
  end

  defp describe(%Ecto.Changeset{} = changeset) do
    %{reason: "invalid", details: ErrorResponse.field_errors(changeset)}
  end

  defp describe(reason), do: %{reason: to_string(reason)}

  defp generate_session_id,
    do: :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
end
