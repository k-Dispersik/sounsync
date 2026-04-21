defmodule SoundsyncWeb.Formatter do

  def format(%Core.DB.User{} = user) do
    %{
      id: user.id,
      name: user.name,
      email: user.email
    }
  end

  def format(%Core.DB.Project{} = project) do
    %{
      id: project.id,
      title: project.title,
      description: project.description,
      tracks: Enum.map(project.tracks, &format/1)
    }
  end

  def format(%Core.DB.Track{} = track) do
    %{
      id: track.id,
      row_index: track.row_index,
      clips: Enum.map(track.clips, &format/1)
    }
  end

  def format(%Core.DB.Clip{} = clip) do
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

  # Placeholder for actual settings formatting
  def format(%Core.DB.ClipSetting{} = _settings) do
    %{}
  end
end
