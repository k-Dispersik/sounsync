defmodule SoundsyncWeb.API.V1.ClipController do
  @moduledoc """
  Clips on a track: `/v1/projects/:project_id/tracks/:track_id/clips`.
  """

  use SoundsyncWeb, :controller
  use Params

  alias Core.ProjectsCtx.Tracks
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
         {:ok, clip} <- Tracks.add_clip(track, attrs) do
      clip |> JSON.clip() |> Helpers.response(conn, :created)
    end
  end

  def update(conn, %{"project_id" => project_id, "track_id" => track_id, "id" => id} = params) do
    with {:ok, attrs} <- RequestParams.cast(&update_clip_params/1, params),
         {:ok, clip_id} <- ProjectScope.cast_id(id),
         {:ok, project} <- ProjectScope.fetch(conn, project_id, :write),
         {:ok, track} <- ProjectScope.fetch_track(project, track_id),
         {:ok, clip} <- update_clip(track, clip_id, attrs) do
      clip |> JSON.clip() |> Helpers.response(conn, :ok)
    end
  end

  # `Tracks.update_clip/3` still answers with a bare string for a missing clip;
  # translate it here so the fallback controller sees a reason it knows.
  defp update_clip(track, clip_id, attrs) do
    case Tracks.update_clip(track, clip_id, attrs) do
      {:ok, clip} -> {:ok, clip}
      {:error, message} when is_binary(message) -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end
end
