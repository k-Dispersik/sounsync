defmodule Core.DB.Clip do
  use Ecto.Schema

  schema "clips" do
    field :name, :string
    field :duration, :integer

    belongs_to :track, Core.DB.Track
  end
end
