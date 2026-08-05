defmodule SoundsyncWeb.API.V1.ClipController do
  @moduledoc """
  Clips on a track: `/v1/projects/:project_id/tracks/:track_id/clips`.
  """

  use SoundsyncWeb, :controller
  use Params

  alias Core.Projects
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams
  alias SoundsyncWeb.ProjectScope

  action_fallback SoundsyncWeb.FallbackController

  defparams(
    create_clip_params(%{
      title: :string,
      type: :string,
      start_time!: :integer,
      duration!: :integer,
      file_path: :string
    })
  )

  defparams(
    update_clip_params(%{
      title: :string,
      type: :string,
      start_time: :integer,
      duration: :integer,
      file_path: :string
    })
  )

  def create(conn, %{"project_id" => project_id, "track_id" => track_id} = params) do
    with {:ok, attrs} <- RequestParams.cast(&create_clip_params/1, params),
         {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, track} <- ProjectScope.fetch_track(project, track_id),
         {:ok, clip} <- Projects.add_clip(track, attrs) do
      clip |> JSON.clip() |> Helpers.response(conn, :created)
    end
  end

  def update(conn, %{"project_id" => project_id, "track_id" => track_id, "id" => id} = params) do
    with {:ok, attrs} <- RequestParams.cast(&update_clip_params/1, params),
         {:ok, clip_id} <- RequestParams.cast_id(id),
         {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, track} <- ProjectScope.fetch_track(project, track_id),
         {:ok, clip} <- Projects.update_clip(track, clip_id, attrs) do
      clip |> JSON.clip() |> Helpers.response(conn, :ok)
    end
  end
end
