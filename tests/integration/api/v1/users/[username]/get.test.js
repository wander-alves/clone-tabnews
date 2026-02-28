import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[GET] /api/v1/users/[username/", () => {
  describe("Anonymous user", () => {
    test("it should be able to search username with exact case match", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "JohnDoe",
          email: "john.doe@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/JohnDoe",
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        username: "JohnDoe",
        email: "john.doe@example.com",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
    });

    test("it should be able to search username with case mismatch", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "janedoe",
          email: "jane.doe@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/JaneDoe",
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        username: "janedoe",
        email: "jane.doe@example.com",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
    });

    test("it should not be able to search non-existent user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/Ziriguidum",
      );

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({
        name: "NotFoundError",
        message: "Não foi possível localizar o usuário informado.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    });
  });
});
