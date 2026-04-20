defmodule SoundsyncWeb.JSON do

  alias SoundsyncWeb.Formatter

  def encode!(data) do
    Jason.encode!(data)
  end

  def user(%Core.DB.User{} = user) do
    Formatter.format(user)
  end

  def project(%Core.DB.Project{} = project, :short) do
    Formatter.format(project)
  end

  def project(%Core.DB.Project{tracks: tracks} = project, :detailed) do
    Formatter.format(project) |> add_tracks(tracks)
  end

  def add_tracks(project_map, tracks) do
    Map.put(project_map, :tracks, Enum.map(tracks, &Formatter.format/1)) |> add_clips()
  end

  def add_clips(project_map) do
    Map.update!(project_map, :tracks, fn tracks ->
      Enum.map(tracks, fn track ->
        Map.put(track, :clips, Enum.map(track.clips, &Formatter.format/1))
      end)
    end)
  end
end
