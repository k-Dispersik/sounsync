defmodule Core.Projects.Clip do
  use Ecto.Schema

  @types [:piano, :guitar, :drums, :bass, :recording, :effect]

  schema "clips" do
    field :title, :string
    field :type, Ecto.Enum, values: @types
    # in milliseconds
    field :start_time, :integer
    # in milliseconds
    field :duration, :integer
    field :file_path, :string

    embeds_one :settings, Core.Projects.ClipSetting

    belongs_to :track, Core.Projects.Track
    belongs_to :audio_file, Core.Storage.AudioFile
  end
end
