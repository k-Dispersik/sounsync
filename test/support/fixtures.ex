defmodule Soundsync.Fixtures do
  @moduledoc """
  Test factories.

  Plain functions on purpose: a fixture that needs its own documentation costs
  more than the duplication it saves. Every one of them takes an attribute map
  that overrides the defaults and returns a persisted record.
  """

  alias Core.Accounts
  alias Core.DB.Project
  alias Core.DB.Track
  alias Core.Projects

  @doc "Creates a user. The email is unique unless one is given."
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        name: "Test User",
        email: "user#{System.unique_integer([:positive])}@example.com",
        password: "password123"
      })
      |> Accounts.register_user()

    user
  end

  @doc """
  Creates a project. Pass `:user` to attach it to an existing user, otherwise a
  fresh one is created.
  """
  def project_fixture(attrs \\ %{}) do
    {user, attrs} = Map.pop_lazy(Map.new(attrs), :user, &user_fixture/0)

    attrs =
      Enum.into(attrs, %{
        title: "Test Project",
        description: "Created by a fixture",
        settings: %{bpm: 120, time_signature: :four_four, timeline_length_ms: 60_000}
      })

    {:ok, project} = Projects.create_project(user, attrs)
    project
  end

  @doc "Creates a track on the given project."
  def track_fixture(%Project{} = project, attrs \\ %{}) do
    {:ok, track} = Projects.add_track(project, Enum.into(attrs, %{row_index: 0}))
    track
  end

  @doc "Creates a clip on the given track."
  def clip_fixture(%Track{} = track, attrs \\ %{}) do
    {:ok, clip} =
      Projects.add_clip(
        track,
        Enum.into(attrs, %{
          title: "Test Clip",
          type: :drums,
          start_time: 0,
          duration: 4_000,
          file_path: "samples/test.wav"
        })
      )

    clip
  end
end
