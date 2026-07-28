defmodule SoundsyncWeb.Formatter do
  @moduledoc """
  Turns database schemas into maps that are safe to send outside.

  The single place that decides which fields are public, and the only place
  that knows an association may not be loaded. A key is left out entirely
  rather than sent as `null`: "we did not load the tracks" and "this project
  has no tracks" are different facts, and a client that cannot tell them apart
  will eventually render the wrong thing.
  """

  alias Core.DB.Clip
  alias Core.DB.ClipSetting
  alias Core.DB.Project
  alias Core.DB.ProjectSetting
  alias Core.DB.Track
  alias Core.DB.User

  def format(%User{} = user) do
    %{
      id: user.id,
      name: user.name,
      email: user.email
    }
  end

  def format(%Project{} = project) do
    %{
      id: project.id,
      title: project.title,
      description: project.description,
      settings: format(project.settings)
    }
    |> put_loaded(:tracks, project.tracks)
  end

  def format(%Track{} = track) do
    %{
      id: track.id,
      project_id: track.project_id,
      row_index: track.row_index
    }
    |> put_loaded(:clips, track.clips)
  end

  def format(%Clip{} = clip) do
    %{
      id: clip.id,
      type: clip.type,
      title: clip.title,
      start_time: clip.start_time,
      duration: clip.duration,
      settings: format(clip.settings),
      file_path: clip.file_path
    }
  end

  # Clip settings have no fields yet; an empty object keeps the key stable for
  # clients that already read it.
  def format(%ClipSetting{} = _settings), do: %{}

  def format(%ProjectSetting{} = settings) do
    %{
      "BPM" => settings.bpm,
      "timeSignature" => SoundsyncWeb.Helpers.parse_time_signature(settings.time_signature),
      "timelineLengthMs" => settings.timeline_length_ms
    }
  end

  def format(nil), do: nil

  defp put_loaded(map, _key, %Ecto.Association.NotLoaded{}), do: map
  defp put_loaded(map, key, records), do: Map.put(map, key, Enum.map(records, &format/1))
end
