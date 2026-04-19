defmodule Core.DB.Clip do
  use Ecto.Schema

  schema "clips" do
    field :start_time, :integer
    field :duration, :integer
    field :settings, :map
    field :file_path, :string

    belongs_to :track, Core.DB.Track
  end
end
