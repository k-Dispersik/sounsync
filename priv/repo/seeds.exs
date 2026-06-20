# Local development state: one user, one project, three tracks, six clips.
# Runs as part of `mix ecto.setup` and `mix ecto.reset`, or on its own:
#
#     mix run priv/repo/seeds.exs
#
# Idempotent: if the demo user already exists, the script does nothing.

alias Core.DB.User
alias Core.ProjectsCtx.Projects
alias Core.ProjectsCtx.Tracks
alias Core.UsersCtx.Users
alias Soundsync.Repo

email = "demo@soundsync.local"
password = "password123"

# File paths point at samples that do not exist yet: storage comes later, and
# the timeline already draws clips from their metadata alone.
tracks = [
  {0,
   [
     %{
       title: "Kick",
       type: :drums,
       start_time: 0,
       duration: 8_000,
       file_path: "samples/drums/kick.wav"
     },
     %{
       title: "Hats",
       type: :drums,
       start_time: 8_000,
       duration: 8_000,
       file_path: "samples/drums/hats.wav"
     }
   ]},
  {1,
   [
     %{
       title: "Bassline A",
       type: :bass,
       start_time: 0,
       duration: 16_000,
       file_path: "samples/bass/a_minor.wav"
     },
     %{
       title: "Bassline B",
       type: :bass,
       start_time: 24_000,
       duration: 8_000,
       file_path: "samples/bass/b_minor.wav"
     }
   ]},
  {2,
   [
     %{
       title: "Rhodes chords",
       type: :piano,
       start_time: 4_000,
       duration: 12_000,
       file_path: "samples/keys/rhodes.wav"
     },
     %{
       title: "Vocal take 3",
       type: :recording,
       start_time: 20_000,
       duration: 10_000,
       file_path: "samples/vocals/take3.wav"
     }
   ]}
]

case Repo.get_by(User, email: email) do
  %User{} ->
    IO.puts("Seeds skipped: #{email} already exists.")

  nil ->
    {:ok, user} = Users.create(%{name: "Demo User", email: email, password: password})

    {:ok, _user} =
      Users.create_project(user, %{
        title: "Demo session",
        description: "Sample project for local development",
        settings: %{bpm: 128, time_signature: :four_four, timeline_length_ms: 60_000}
      })

    [project] = Projects.list_by_user(user.id)

    Enum.each(tracks, fn {row_index, clips} ->
      {:ok, track} = Projects.add_track(project, %{row_index: row_index})
      Enum.each(clips, fn attrs -> {:ok, _clip} = Tracks.add_clip(track, attrs) end)
    end)

    IO.puts("Seeded #{email} / #{password} with project \"#{project.title}\".")
end
