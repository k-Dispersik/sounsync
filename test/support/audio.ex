defmodule Soundsync.TestAudio do
  @moduledoc """
  Builds real (if boring) audio files for tests.

  Written by hand rather than shipped as a fixture: a checked-in binary is
  something nobody can review, and a generator makes it trivial to ask for a
  different length or a silent file.
  """

  @sample_rate 22_050

  @doc """
  A mono 16-bit PCM WAV of the given length, holding a sine wave.

  `amplitude` is 0..1; zero produces silence, which is what a "no waveform to
  speak of" test wants.
  """
  def wav(duration_ms, amplitude \\ 0.8) do
    sample_count = div(@sample_rate * duration_ms, 1000)
    samples = for index <- 0..(sample_count - 1), into: <<>>, do: sample(index, amplitude)

    header(byte_size(samples)) <> samples
  end

  defp sample(index, amplitude) do
    value = round(amplitude * 32_000 * :math.sin(2 * :math.pi() * 440 * index / @sample_rate))
    <<value::little-signed-16>>
  end

  defp header(data_size) do
    byte_rate = @sample_rate * 2

    "RIFF" <>
      <<36 + data_size::little-32>> <>
      "WAVEfmt " <>
      <<16::little-32, 1::little-16, 1::little-16, @sample_rate::little-32, byte_rate::little-32,
        2::little-16,
        16::little-16>> <>
      "data" <> <<data_size::little-32>>
  end
end
