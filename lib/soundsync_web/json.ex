defmodule SoundsyncWeb.JSON do
  @moduledoc """
  Builds the JSON bodies returned by the API.

  Two shapes per resource, and no more. `:summary` is what a list returns: the
  record's own fields, no associations, so a page of projects costs one query.
  `:full` is what a single resource returns, associations included. Anything
  in between means a client cannot know what it is holding.
  """

  alias Core.DB.Clip
  alias Core.DB.Project
  alias Core.DB.Track
  alias Core.DB.User
  alias SoundsyncWeb.Formatter

  def encode!(data), do: Jason.encode!(data)

  def user(%User{} = user), do: Formatter.format(user)

  @doc """
  `:summary` drops the associations even when they happen to be loaded, so the
  answer does not depend on what a caller preloaded by accident.
  """
  def project(%Project{} = project, :summary) do
    project |> Formatter.format() |> Map.delete(:tracks)
  end

  def project(%Project{} = project, :full), do: Formatter.format(project)

  def track(%Track{} = track), do: Formatter.format(track)

  def clip(%Clip{} = clip), do: Formatter.format(clip)
end
