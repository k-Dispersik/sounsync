defmodule Core.Projects.Track do
  use Ecto.Schema

  schema "tracks" do
    field :row_index, :integer

    belongs_to :project, Core.Projects.Project
    has_many :clips, Core.Projects.Clip
  end
end
