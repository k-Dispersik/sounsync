defmodule Core.DB.ProjectSetting do
  use Ecto.Schema

  @primary_key false

  embedded_schema do
    field :bpm, :integer, default: 120
  end
end
