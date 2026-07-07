defmodule SoundsyncWeb.API.V1.AuthControllerTest do
  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts

  @password "password123"

  defp authed(conn, user) do
    put_req_header(conn, "authorization", "Bearer " <> Accounts.create_session_token(user))
  end

  describe "POST /v1/auth/register" do
    test "creates the user and hands back a token", %{conn: conn} do
      conn =
        post(conn, ~p"/v1/auth/register", %{
          name: "Ada Lovelace",
          email: "ada@example.com",
          password: @password
        })

      assert %{"token" => token, "user" => user} = json_response(conn, 201)
      assert user["email"] == "ada@example.com"
      refute Map.has_key?(user, "password")
      assert Accounts.get_user_by_session_token(token)
    end

    test "reports invalid data field by field", %{conn: conn} do
      conn =
        post(conn, ~p"/v1/auth/register", %{name: "Ada", email: "nope", password: "123"})

      assert %{"details" => details} = json_response(conn, 422)
      assert details["email"] == ["has invalid format"]
      assert details["password"] == ["should be at least 6 character(s)"]
    end

    test "refuses an email that is taken", %{conn: conn} do
      user_fixture(%{email: "ada@example.com"})

      conn =
        post(conn, ~p"/v1/auth/register", %{
          name: "Someone",
          email: "ada@example.com",
          password: @password
        })

      assert json_response(conn, 422)["details"]["email"] == ["has already been taken"]
    end
  end

  describe "POST /v1/auth/login" do
    test "returns a token for the right password", %{conn: conn} do
      user_fixture(%{email: "ada@example.com", password: @password})

      conn = post(conn, ~p"/v1/auth/login", %{email: "ada@example.com", password: @password})

      assert %{"token" => token} = json_response(conn, 200)
      assert Accounts.get_user_by_session_token(token)
    end

    test "answers 401 the same way for a wrong password and an unknown email", %{conn: conn} do
      user_fixture(%{email: "ada@example.com", password: @password})

      wrong = post(conn, ~p"/v1/auth/login", %{email: "ada@example.com", password: "nope"})
      unknown = post(conn, ~p"/v1/auth/login", %{email: "ghost@example.com", password: @password})

      assert json_response(wrong, 401) == json_response(unknown, 401)
    end

    test "needs both fields", %{conn: conn} do
      assert json_response(post(conn, ~p"/v1/auth/login", %{email: "ada@example.com"}), 422)
    end
  end

  describe "authenticated routes" do
    test "GET /v1/auth/me returns the caller", %{conn: conn} do
      user = user_fixture()

      conn = conn |> authed(user) |> get(~p"/v1/auth/me")

      assert json_response(conn, 200)["email"] == user.email
    end

    test "DELETE /v1/auth/logout revokes the token that was used", %{conn: conn} do
      user = user_fixture()
      token = Accounts.create_session_token(user)

      conn =
        conn
        |> put_req_header("authorization", "Bearer " <> token)
        |> delete(~p"/v1/auth/logout")

      assert response(conn, 204)
      refute Accounts.get_user_by_session_token(token)
    end
  end

  describe "S-1: no token, no data" do
    setup %{conn: conn} do
      project = project_fixture()
      track = track_fixture(project)
      clip = clip_fixture(track)

      %{conn: conn, project: project, track: track, clip: clip}
    end

    test "every project route answers 401", ctx do
      %{conn: conn, project: project, track: track, clip: clip} = ctx

      requests = [
        get(conn, ~p"/v1/projects"),
        get(conn, ~p"/v1/projects/#{project.id}"),
        post(conn, ~p"/v1/projects", %{title: "t", description: "d"}),
        patch(conn, ~p"/v1/projects/#{project.id}/settings", %{bpm: 100}),
        post(conn, ~p"/v1/projects/#{project.id}/tracks", %{row: 1}),
        post(conn, ~p"/v1/projects/#{project.id}/tracks/#{track.id}/clips", %{}),
        patch(conn, ~p"/v1/projects/#{project.id}/tracks/#{track.id}/clips/#{clip.id}", %{}),
        delete(conn, ~p"/v1/projects/#{project.id}/tracks/#{track.id}")
      ]

      for response <- requests do
        assert json_response(response, 401) == %{"error" => "Unauthorized"}
      end
    end

    test "so do the user and session routes", %{conn: conn} do
      user = user_fixture()

      assert json_response(get(conn, ~p"/v1/users/#{user.id}"), 401)
      assert json_response(get(conn, ~p"/v1/auth/me"), 401)
      assert json_response(delete(conn, ~p"/v1/auth/logout"), 401)
    end

    test "a malformed or expired token is no better than none", %{conn: conn} do
      for header <- ["", "Bearer", "Bearer not-a-token", "Basic abc"] do
        conn = conn |> put_req_header("authorization", header) |> get(~p"/v1/auth/me")
        assert json_response(conn, 401)
      end
    end
  end
end
