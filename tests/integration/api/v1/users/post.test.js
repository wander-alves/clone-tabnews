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

describe("[POST] /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("it should be able to register an unique and valid user", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "john.doe",
          email: "john.doe@example.com",
          password: "strongpassword",
        }),
      });

      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toEqual({
        id: body.id,
        username: "john.doe",
        email: "john.doe@example.com",
        password: "strongpassword",
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
    });

    test("it should not be able to register a duplicated e-mail", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "jane.doe",
          email: "jane.doe@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "jane-doe",
          email: "Jane.doe@example.com",
          password: "strongpassword",
        }),
      });

      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está registrado.",
        action: "Utilize outro endereço de e-mail para realizar o cadastro.",
        status_code: 400,
      });
    });

    test("it should not be able to register a duplicated username", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "jane.doe",
          email: "jane.doe@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Jane.Doe",
          email: "jane-doe@example.com",
          password: "strongpassword",
        }),
      });

      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({
        name: "ValidationError",
        message: "O username informado já está registrado.",
        action: "Utilize outro endereço de usuário para realizar o cadastro.",
        status_code: 400,
      });
    });
  });
});
