defmodule Core.Storage.SignatureTest do
  @moduledoc """
  Pure byte matching, so the table is spelled out: this is the check that
  stands between an upload endpoint and a file that is not audio at all.
  """

  use ExUnit.Case, async: true

  alias Core.Storage.Signature

  test "recognises the containers the player can open" do
    assert {:ok, :wav} = Signature.detect("RIFF" <> <<36, 0, 0, 0>> <> "WAVEfmt ")
    assert {:ok, :flac} = Signature.detect("fLaC" <> <<0, 0, 0, 34>>)
    assert {:ok, :ogg} = Signature.detect("OggS" <> <<0, 2, 0, 0>>)
    assert {:ok, :mp3} = Signature.detect("ID3" <> <<3, 0, 0, 0>>)
    assert {:ok, :mp3} = Signature.detect(<<0xFF, 0xFB, 0x90, 0x00>>)
    assert {:ok, :mp4} = Signature.detect(<<0, 0, 0, 32>> <> "ftypM4A ")
  end

  test "refuses anything else" do
    for bytes <- [
          "MZ" <> <<0x90, 0x00>>,
          <<0x7F, "ELF">>,
          "#!/bin/sh\n",
          "RIFF" <> <<0, 0, 0, 0>> <> "AVI ",
          "",
          <<0xFF, 0xFF, 0, 0>>
        ] do
      assert :error = Signature.detect(bytes)
    end
  end

  test "a RIFF container that is not WAVE does not pass as audio" do
    assert :error = Signature.detect("RIFF" <> <<0, 0, 0, 0>> <> "WEBP")
  end

  describe "matches?/2" do
    test "accepts the types a format is normally served as" do
      assert Signature.matches?(:wav, "audio/wav")
      assert Signature.matches?(:wav, "audio/x-wav")
      assert Signature.matches?(:mp3, "audio/mpeg")
      assert Signature.matches?(:mp4, "audio/mp4")
    end

    test "rejects a claim the bytes contradict" do
      refute Signature.matches?(:wav, "audio/mpeg")
      refute Signature.matches?(:mp3, "audio/wav")
      refute Signature.matches?(:ogg, "application/octet-stream")
    end
  end
end
