defmodule SoundsyncWeb.API.V1.ProjectController do
  use SoundsyncWeb, :controller
  use Params

  alias Core.ProjectsCtx.Projects
  alias Core.ProjectsCtx.Tracks

  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON

  require OK

  def index(conn, _params) do
    projects = Projects.list()

    Enum.map(projects, &JSON.project(&1, :short)) |> Helpers.response(conn, :ok)
  end

  def show(conn, %{"id" => id}) do
    OK.try do
      project <- Projects.get(id, assoc: [tracks: [:clips]]) |> OK.required()
    after
      JSON.project(project, :detailed) |> Helpers.response(conn, :ok)
    rescue
      _e -> Helpers.response(%{error: "Project not found"}, conn, :not_found)
    end
  end

  def create_project(conn, %{"title" => title, "description" => description}) do
    OK.try do
      project <- Projects.create(%{title: title, description: description})
    after
      JSON.project(project, :detailed) |> Helpers.response(conn, :created)
    rescue
      e -> Helpers.response(%{error: e}, conn, :internal_server_error)
    end
  end

  def create_track(conn, %{"project_id" => project_id, "row" => row}) do
    OK.try do
      project <- Projects.get(project_id, assoc: [tracks: [:clips]]) |> OK.required()
      track <- Projects.add_track(project, %{row_index: row})
    after
      JSON.track(track) |> Helpers.response(conn, :created)
    rescue
      e -> Helpers.response(%{error: e}, conn, :internal_server_error)
    end
  end

  defparams(
    create_clip_params(%{
      title: :string,
      type: :string,
      start_time!: :integer,
      duration!: :integer,
      file_path: :string,
      project_id!: :integer,
      track_id!: :integer
    })
  )

  def create_clip(conn, params) do
    OK.try do
      clip_attrs <- create_clip_params(params) |> Helpers.get_changes?()
      project <- Projects.get(clip_attrs.project_id, assoc: [tracks: [:clips]]) |> OK.required()
      track <- Projects.get_track_by_id(project, clip_attrs.track_id) |> OK.required()
      clip <- Tracks.add_clip(track, clip_attrs)
    after
      JSON.clip(clip) |> Helpers.response(conn, :created)
    rescue
      e -> Helpers.response(%{error: inspect(e)}, conn, :internal_server_error)
    end
  end

  defparams(
    update_clip_params(%{
      start_time: :integer,
      duration: :integer,
      title: :string,
      type: :string,
      file_path: :string,
      project_id: :integer,
      track_id: :integer,
      clip_id: :integer
    })
  )

  def update_clip(conn, params) do
    OK.try do
      clip_attrs <- update_clip_params(params) |> Helpers.get_changes?()
      project <- Projects.get(clip_attrs.project_id, assoc: [tracks: [:clips]]) |> OK.required()
      track <- Projects.get_track_by_id(project, clip_attrs.track_id) |> OK.required()
      updated_clip <- Tracks.update_clip(track, clip_attrs.clip_id, clip_attrs)
    after
      JSON.clip(updated_clip) |> Helpers.response(conn, :ok)
    rescue
      e -> Helpers.response(%{error: inspect(e)}, conn, :internal_server_error)
    end
  end

  def delete_track(conn, %{"project_id" => project_id, "track_id" => track_id}) do
    OK.try do
      project <- Projects.get(project_id, assoc: [:tracks]) |> OK.required()
      track <- Projects.get_track_by_id(project, String.to_integer(track_id)) |> OK.required()
      _ <- Tracks.delete(track)
    after
      Helpers.response(%{message: "Track deleted"}, conn, :ok)
    rescue
      e -> Helpers.response(%{error: e}, conn, :internal_server_error)
    end
  end

  def update_settings(conn, %{"id" => id} = params) do
    OK.try do
      project <- Projects.get(id, assoc: [tracks: [:clips]]) |> OK.required()
      settings_attrs = project_settings_attrs(params)
      _ <- Projects.update(project, %{settings: settings_attrs})
      updated_project <- Projects.get(id, assoc: [tracks: [:clips]]) |> OK.required()
    after
      JSON.project(updated_project, :detailed) |> Helpers.response(conn, :ok)
    rescue
      _e ->
        Helpers.response(
          %{error: "Failed to update project settings"},
          conn,
          :unprocessable_entity
        )
    end
  end

  defp project_settings_attrs(%{"settings" => settings_params}) when is_map(settings_params) do
    %{
      bpm: Map.get(settings_params, "BPM"),
      time_signature: Helpers.parse_time_signature(Map.get(settings_params, "timeSignature")),
      timeline_length_ms: Map.get(settings_params, "timelineLengthMs")
    }
  end

  defp project_settings_attrs(_params), do: nil
end
