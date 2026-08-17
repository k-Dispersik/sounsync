defmodule Core.Storage.AnalysisTest do
  @moduledoc """
  Runs against real ffmpeg on real audio. A stub would only prove the parsing
  of output we made up ourselves.
  """

  use ExUnit.Case, async: true

  alias Core.Storage.Analysis
  alias Soundsync.TestAudio

  @moduletag :ffmpeg

  setup do
    path = Path.join(System.tmp_dir!(), "analysis-#{System.unique_integer([:positive])}.wav")
    on_exit(fn -> File.rm(path) end)
    %{path: path}
  end

  test "measures the duration of a file", %{path: path} do
    File.write!(path, TestAudio.wav(1_000))

    assert {:ok, %{duration_ms: duration}} = Analysis.analyse(path)
    assert_in_delta duration, 1_000, 60
  end

  test "produces one peak per window, sized to the duration", %{path: path} do
    File.write!(path, TestAudio.wav(1_000))

    {:ok, %{peaks: peaks}} = Analysis.analyse(path)

    assert byte_size(peaks) > 0
    assert_in_delta byte_size(peaks), Analysis.peaks_per_second(), 40
  end

  test "loud audio gives loud peaks, silence gives quiet ones", %{path: path} do
    File.write!(path, TestAudio.wav(500, 0.9))
    {:ok, %{peaks: loud}} = Analysis.analyse(path)

    File.write!(path, TestAudio.wav(500, 0.0))
    {:ok, %{peaks: silent}} = Analysis.analyse(path)

    assert loud |> :binary.bin_to_list() |> Enum.max() > 100
    assert silent |> :binary.bin_to_list() |> Enum.max() < 5
  end

  test "every peak fits in a byte", %{path: path} do
    File.write!(path, TestAudio.wav(300, 1.0))

    {:ok, %{peaks: peaks}} = Analysis.analyse(path)

    assert Enum.all?(:binary.bin_to_list(peaks), &(&1 in 0..127))
  end

  test "a file that is not audio is reported, not guessed at", %{path: path} do
    File.write!(path, "this is not audio")

    assert {:error, :undecodable} = Analysis.analyse(path)
  end
end
