defmodule Core.Storage.AudioFileTest do
  use Soundsync.DataCase, async: true

  alias Core.Storage
  alias Core.Storage.AudioFile

  defp attrs(project, overrides) do
    Enum.into(overrides, %{
      project_id: project.id,
      storage_key: Storage.build_key(project.id, "track.wav"),
      original_filename: "track.wav",
      content_type: "audio/wav",
      byte_size: 1_024,
      checksum: "sha256-#{System.unique_integer([:positive])}"
    })
  end

  defp insert(project, overrides \\ %{}) do
    %AudioFile{} |> AudioFile.changeset(attrs(project, overrides)) |> Repo.insert()
  end

  test "a file starts out pending" do
    project = project_fixture()

    assert {:ok, %AudioFile{status: :pending}} = insert(project)
  end

  test "the same bytes cannot be stored twice in one project" do
    project = project_fixture()
    {:ok, first} = insert(project)

    assert {:error, changeset} = insert(project, %{checksum: first.checksum})
    assert changeset.errors != []
  end

  test "the same bytes in two projects are two files" do
    checksum = "sha256-shared"
    {:ok, _} = insert(project_fixture(), %{checksum: checksum})

    assert {:ok, _} = insert(project_fixture(), %{checksum: checksum})
  end

  test "a storage key is unique across the whole store" do
    project = project_fixture()
    {:ok, first} = insert(project)

    assert {:error, changeset} =
             insert(project_fixture(), %{storage_key: first.storage_key})

    assert changeset.errors != []
  end

  test "an empty file is refused" do
    assert {:error, changeset} = insert(project_fixture(), %{byte_size: 0})
    assert "must be greater than 0" in errors_on(changeset).byte_size
  end

  test "analysis fills in the duration and peaks" do
    {:ok, file} = insert(project_fixture())

    assert {:ok, analysed} =
             file
             |> AudioFile.analysed_changeset(%{
               status: :ready,
               duration_ms: 8_000,
               peaks: <<1, 2, 3>>
             })
             |> Repo.update()

    assert analysed.status == :ready
    assert analysed.duration_ms == 8_000
    assert analysed.peaks == <<1, 2, 3>>
  end

  test "deleting the project takes its files with it" do
    project = project_fixture()
    {:ok, _} = insert(project)

    Repo.delete!(project)

    assert Repo.aggregate(AudioFile, :count) == 0
  end

  test "a clip may point at a file, and the file cannot then be deleted" do
    project = project_fixture()
    {:ok, file} = insert(project)
    track = track_fixture(project)
    clip = clip_fixture(track)

    {:ok, _clip} = clip |> Ecto.Changeset.change(audio_file_id: file.id) |> Repo.update()

    assert_raise Ecto.ConstraintError, fn -> Repo.delete!(file) end
  end
end
