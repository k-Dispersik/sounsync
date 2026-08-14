defmodule Core.Storage.Signature do
  @moduledoc """
  Recognises audio containers by their first bytes.

  The `content-type` in an upload request is a claim by the client, and a
  claim is not evidence: a renamed executable arrives as `audio/wav` just as
  easily as a real one. The first bytes of a file are much harder to fake into
  something that both passes here and does something else elsewhere.

  Only the formats the player can actually open are recognised. Anything else
  is rejected rather than stored and puzzled over later.
  """

  import Bitwise

  @type format :: :wav | :mp3 | :flac | :ogg | :mp4

  @doc """
  The format of the given leading bytes, or `:error` if it is not one we take.

  Needs at most #{12} bytes; more are ignored.
  """
  @spec detect(binary()) :: {:ok, format()} | :error
  def detect(<<"RIFF", _size::binary-size(4), "WAVE", _rest::binary>>), do: {:ok, :wav}
  def detect(<<"fLaC", _rest::binary>>), do: {:ok, :flac}
  def detect(<<"OggS", _rest::binary>>), do: {:ok, :ogg}
  def detect(<<"ID3", _rest::binary>>), do: {:ok, :mp3}
  def detect(<<_size::binary-size(4), "ftyp", _rest::binary>>), do: {:ok, :mp4}

  # A bare MPEG frame header: eleven set bits, then fields that must not hold
  # their reserved values. Without the last two checks a run of 0xFF bytes —
  # which any binary can contain — would pass as an MP3.
  def detect(<<0xFF, second, third, _rest::binary>>) when (second &&& 0xE0) == 0xE0 do
    version = (second &&& 0x18) >>> 3
    layer = (second &&& 0x06) >>> 1
    bitrate = (third &&& 0xF0) >>> 4
    sample_rate = (third &&& 0x0C) >>> 2

    # Bitrate 0 is the "free format" nobody encodes and 0xF is invalid; both
    # are far likelier to be a run of zero or 0xFF bytes in some other file.
    if version == 1 or layer == 0 or bitrate in [0, 0x0F] or sample_rate == 3,
      do: :error,
      else: {:ok, :mp3}
  end

  def detect(_bytes), do: :error

  @doc "How many leading bytes `detect/1` needs."
  def probe_size, do: 12

  @doc """
  Whether the detected format is one the claimed content type could produce.
  A `.wav` announced as `audio/mpeg` is a mismatch worth refusing: one of the
  two is wrong, and we cannot tell which.
  """
  @spec matches?(format(), String.t()) :: boolean()
  def matches?(format, content_type), do: content_type in content_types(format)

  defp content_types(:wav), do: ["audio/wav", "audio/x-wav", "audio/wave"]
  defp content_types(:mp3), do: ["audio/mpeg", "audio/mp3"]
  defp content_types(:flac), do: ["audio/flac", "audio/x-flac"]
  defp content_types(:ogg), do: ["audio/ogg", "application/ogg"]
  defp content_types(:mp4), do: ["audio/mp4", "audio/m4a", "audio/x-m4a"]
end
