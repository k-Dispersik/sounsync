# Analysis tests need real ffmpeg; skip them where it is not installed rather
# than failing for a reason that has nothing to do with the code.
ffmpeg_available? =
  System.find_executable("ffmpeg") != nil and System.find_executable("ffprobe") != nil

exclude = if ffmpeg_available?, do: [], else: [:ffmpeg]

ExUnit.start(exclude: exclude)
Ecto.Adapters.SQL.Sandbox.mode(Soundsync.Repo, :manual)
