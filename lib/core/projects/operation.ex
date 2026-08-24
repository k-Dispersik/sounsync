defmodule Core.Projects.Operation do
  @moduledoc """
  One edit to a project, described in the vocabulary of the editor rather than
  of HTTP: `clip.move`, `track.create`, `project.settings.update`.

  Realtime edits arrive as operations because a channel message has no verb and
  no path to carry the intent, and because "what happened" is exactly what has
  to be sent on to everyone else. The same steps run for every one of them, in
  the same order — authorise, validate, persist — so a new operation cannot
  accidentally skip one.

  Nothing here knows about JSON or sockets: it takes a project, a user and a
  payload, and answers with what changed.
  """

  import Ecto.Changeset

  alias Core.Accounts.User
  alias Core.Projects
  alias Core.Projects.Clip
  alias Core.Projects.Project
  alias Core.Projects.Track

  @type event :: %{type: String.t(), data: term()}

  # Field types per operation, with the required ones listed separately. A
  # payload is cast against these before anything is touched.
  @schemas %{
    "track.create" => {%{row_index: :integer}, [:row_index]},
    "track.delete" => {%{track_id: :integer}, [:track_id]},
    "clip.create" =>
      {%{
         track_id: :integer,
         start_time: :integer,
         duration: :integer,
         type: :string,
         title: :string,
         audio_file_id: :integer
       }, [:track_id, :start_time, :duration]},
    "clip.move" =>
      {%{clip_id: :integer, track_id: :integer, start_time: :integer},
       [:clip_id, :track_id, :start_time]},
    "clip.update" =>
      {%{
         clip_id: :integer,
         track_id: :integer,
         start_time: :integer,
         duration: :integer,
         type: :string,
         title: :string,
         audio_file_id: :integer
       }, [:clip_id, :track_id]},
    "clip.delete" => {%{clip_id: :integer, track_id: :integer}, [:clip_id, :track_id]},
    "project.settings.update" =>
      {%{bpm: :integer, time_signature: :string, timeline_length_ms: :integer}, []}
  }

  @doc "Every operation type the channel accepts."
  def types, do: Map.keys(@schemas)

  @doc """
  Runs an operation against a project.

  Returns the event to pass on to the other participants, or the reason it was
  refused. An unknown type is refused rather than ignored: silently dropping an
  edit is how two clients end up disagreeing about what the project contains.
  """
  @spec apply(Project.t(), User.t(), String.t(), map()) ::
          {:ok, event()} | {:error, term()}
  def apply(%Project{} = project, %User{} = user, type, payload) do
    with :ok <- Projects.authorize(:write, user, project),
         {:ok, attrs} <- cast(type, payload) do
      run(project, type, attrs)
    end
  end

  @doc "Validates a payload without applying it."
  @spec cast(String.t(), map()) :: {:ok, map()} | {:error, term()}
  def cast(type, payload) when is_map_key(@schemas, type) do
    {types, required} = Map.fetch!(@schemas, type)

    changeset =
      {%{}, types}
      |> Ecto.Changeset.cast(payload, Map.keys(types))
      |> validate_required(required)

    if changeset.valid?, do: {:ok, changeset.changes}, else: {:error, changeset}
  end

  def cast(_type, _payload), do: {:error, :unknown_operation}

  defp run(project, "track.create", attrs) do
    with {:ok, track} <- Projects.add_track(project, attrs) do
      {:ok, %{type: "track.create", data: track}}
    end
  end

  defp run(project, "track.delete", %{track_id: track_id}) do
    with {:ok, track} <- fetch_track(project, track_id),
         {:ok, _deleted} <- Projects.delete_track(track) do
      {:ok, %{type: "track.delete", data: %{track_id: track_id}}}
    end
  end

  defp run(project, "clip.create", attrs) do
    with {:ok, track} <- fetch_track(project, attrs.track_id),
         {:ok, clip} <- Projects.add_clip(track, attrs) do
      {:ok, %{type: "clip.create", data: clip}}
    end
  end

  defp run(project, "clip.move", attrs), do: update_clip(project, "clip.move", attrs)
  defp run(project, "clip.update", attrs), do: update_clip(project, "clip.update", attrs)

  defp run(project, "clip.delete", %{clip_id: clip_id, track_id: track_id}) do
    with {:ok, track} <- fetch_track(project, track_id),
         {:ok, clip} <- fetch_clip(track, clip_id),
         {:ok, _deleted} <- Projects.delete_clip(clip) do
      {:ok, %{type: "clip.delete", data: %{clip_id: clip_id, track_id: track_id}}}
    end
  end

  defp run(project, "project.settings.update", attrs) do
    with {:ok, updated} <- Projects.update_project(project, %{settings: attrs}) do
      {:ok, %{type: "project.settings.update", data: updated}}
    end
  end

  defp update_clip(project, type, attrs) do
    {clip_id, changes} = Map.pop!(attrs, :clip_id)

    with {:ok, track} <- fetch_track(project, changes.track_id),
         {:ok, clip} <- Projects.update_clip(track, clip_id, changes) do
      {:ok, %{type: type, data: clip}}
    end
  end

  defp fetch_track(project, track_id) do
    case Projects.get_track(project, track_id) do
      nil -> {:error, :not_found}
      %Track{} = track -> {:ok, track}
    end
  end

  defp fetch_clip(%Track{clips: clips}, clip_id) when is_list(clips) do
    case Enum.find(clips, &(&1.id == clip_id)) do
      nil -> {:error, :not_found}
      %Clip{} = clip -> {:ok, clip}
    end
  end
end
