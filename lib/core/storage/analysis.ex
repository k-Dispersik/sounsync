defmodule Core.Storage.Analysis do
  @moduledoc """
  Reads duration and a waveform out of an audio file, using ffmpeg.

  Both are needed before a clip can be drawn, and neither can be had without
  decoding the audio — which is why it happens once, on upload, rather than in
  every browser that opens the project.

  If ffmpeg is not installed the file still becomes usable: the waveform is
  simply absent and the client draws a placeholder. A missing developer tool
  should not make uploads fail.
  """

  require Logger

  # 512 columns per second is enough to see a kick from a pad, and costs about
  # half a kilobyte per second to store and send.
  @peaks_per_second 512
  @sample_rate 22_050
  @samples_per_peak div(@sample_rate, @peaks_per_second)

  @type result :: %{duration_ms: pos_integer() | nil, peaks: binary() | nil}

  @doc "Whether the external tools are present."
  def available?, do: ffprobe() != nil and ffmpeg() != nil

  @doc """
  Analyses the file at `path`.

  Returns what could be measured; a file whose duration cannot be read at all
  is reported as an error, because that means it is not decodable audio.
  """
  @spec analyse(Path.t()) :: {:ok, result()} | {:error, term()}
  def analyse(path) do
    if available?() do
      with {:ok, duration_ms} <- duration(path) do
        {:ok, %{duration_ms: duration_ms, peaks: peaks(path)}}
      end
    else
      Logger.info("ffmpeg not available, storing audio without a waveform")
      {:ok, %{duration_ms: nil, peaks: nil}}
    end
  end

  @doc "Peaks per second in the produced waveform."
  def peaks_per_second, do: @peaks_per_second

  # sobelow_skip ["CI.System"]
  # No shell is involved: `System.cmd/3` passes argv straight to execve, and the
  # path is one the application generated itself.
  defp duration(path) do
    args = [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path
    ]

    case System.cmd(ffprobe(), args, stderr_to_stdout: true) do
      {output, 0} -> parse_duration(output)
      {_output, _status} -> {:error, :undecodable}
    end
  end

  defp parse_duration(output) do
    case output |> String.trim() |> Float.parse() do
      {seconds, _rest} when seconds > 0 -> {:ok, round(seconds * 1000)}
      _other -> {:error, :undecodable}
    end
  end

  # Decoded to mono at a modest rate: the waveform is a picture, not the audio,
  # and a stereo 48 kHz decode would cost far more for the same drawing.
  # sobelow_skip ["CI.System"]
  # No shell is involved: `System.cmd/3` passes argv straight to execve, and the
  # path is one the application generated itself.
  defp peaks(path) do
    args = [
      "-v",
      "error",
      "-i",
      path,
      "-ac",
      "1",
      "-ar",
      Integer.to_string(@sample_rate),
      "-f",
      "s16le",
      "-"
    ]

    case System.cmd(ffmpeg(), args, stderr_to_stdout: false) do
      {pcm, 0} -> downsample(pcm)
      {_output, _status} -> nil
    end
  end

  # One byte per window, holding the loudest sample in it. A trailing partial
  # window is dropped: a column drawn from a fraction of the samples would be
  # quieter than its neighbours for no musical reason.
  defp downsample(pcm) do
    window_bytes = @samples_per_peak * 2

    for <<window::binary-size(window_bytes) <- pcm>>, into: <<>> do
      <<window_peak(window)>>
    end
  end

  defp window_peak(window) do
    loudest =
      for <<sample::little-signed-16 <- window>>, reduce: 0 do
        acc -> max(acc, abs(sample))
      end

    min(127, div(loudest * 127, 32_767))
  end

  defp ffprobe, do: System.find_executable("ffprobe")
  defp ffmpeg, do: System.find_executable("ffmpeg")
end
