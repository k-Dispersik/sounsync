defmodule Core.DB.Track do
  use Ecto.Schema

  schema "tracks" do
    field :title, :string
    field :row_index, :integer
    field :category, :string

    belongs_to :project, Core.DB.Project
    has_many :clips, Core.DB.Clip
  end
end
