defmodule Core.DB.Clip do
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

    embeds_one :settings, Core.DB.ClipSetting

    belongs_to :track, Core.DB.Track
  end
end
