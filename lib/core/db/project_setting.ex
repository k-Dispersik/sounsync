defmodule Core.DB.ProjectSetting do
  use Ecto.Schema

  @primary_key false

  @time_signature_values [
    two_four: "2/4",
    three_four: "3/4",
    four_four: "4/4",
    three_eight: "3/8",
    six_eight: "6/8",
    nine_eight: "9/8",
    twelve_eight: "12/8",
    five_four: "5/4",
    five_eight: "5/8",
    seven_four: "7/4",
    seven_eight: "7/8",
    three_two: "3/2",
    four_two: "4/2"
  ]

  embedded_schema do
    field :bpm, :integer, default: 120
    field :time_signature, Ecto.Enum, values: @time_signature_values, default: :four_four
    field :timeline_length_ms, :integer, default: 60_000
  end

  def get_time_signature_values, do: @time_signature_values
end
