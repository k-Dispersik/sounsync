defmodule Core.DB.Track do
  use Ecto.Schema

  schema "tracks" do
    field :row_index, :integer

    belongs_to :project, Core.DB.Project
    has_many :clips, Core.DB.Clip
  end
end
