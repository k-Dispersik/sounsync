defmodule SoundsyncWeb.JSON do
  @moduledoc """
  Builds the JSON bodies returned by the API.

  The shape of a single record comes from `SoundsyncWeb.Formatter`; this module
  assembles those records into the body of a particular response.
  """

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
    Map.put(project_map, :tracks, Enum.map(tracks, &Formatter.format/1))
  end

  def add_clips(project_map) do
    Map.update!(project_map, :tracks, fn tracks ->
      Enum.map(tracks, fn track ->
        Map.put(track, :clips, Enum.map(track.clips, &Formatter.format/1))
      end)
    end)
  end

  def track(%Core.DB.Track{} = track) do
    Formatter.format(track)
  end

  def clip(%Core.DB.Clip{} = clip) do
    Formatter.format(clip)
  end
end
