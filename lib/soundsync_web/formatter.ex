defmodule SoundsyncWeb.Formatter do
  @moduledoc """
  Turns database schemas into maps that are safe to send outside.

  The single place that decides which fields are public, and the only place
  that knows an association may not be loaded. A key is left out entirely
  rather than sent as `null`: "we did not load the tracks" and "this project
  has no tracks" are different facts, and a client that cannot tell them apart
  will eventually render the wrong thing.
  """

  alias Core.Accounts.User
  alias Core.Projects.Clip
  alias Core.Projects.ClipSetting
  alias Core.Projects.Project
  alias Core.Projects.ProjectSetting
  alias Core.Projects.Track
  alias Core.Storage.AudioFile

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

  def format(%AudioFile{} = file) do
    %{
      id: file.id,
      project_id: file.project_id,
      original_filename: file.original_filename,
      content_type: file.content_type,
      byte_size: file.byte_size,
      duration_ms: file.duration_ms,
      status: file.status
    }
  end

  # Clip settings have no fields yet; an empty object keeps the key stable for
  # clients that already read it.
  def format(%ClipSetting{} = _settings), do: %{}

  def format(%ProjectSetting{} = settings) do
    %{
      bpm: settings.bpm,
      time_signature: SoundsyncWeb.Helpers.parse_time_signature(settings.time_signature),
      timeline_length_ms: settings.timeline_length_ms
    }
  end

  def format(nil), do: nil

  defp put_loaded(map, _key, %Ecto.Association.NotLoaded{}), do: map
  defp put_loaded(map, key, records), do: Map.put(map, key, Enum.map(records, &format/1))
end
