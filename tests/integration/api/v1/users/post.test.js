import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";

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
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername(body.username);
      const correctPasswordMatch = await password.compare(
        "strongpassword",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "wrongpassword",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("it should not be able to register a duplicated username", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: createdUser.username,
          email: createdUser.email,
          password: createdUser.password,
        }),
      });

      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({
        name: "ValidationError",
        message: "O username informado já está registrado.",
        action: "Utilize outro nome de usuário para realizar esta operação.",
        status_code: 400,
      });
    });

    test("it should not be able to register a duplicated e-mail", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "joseph-doe",
          email: createdUser.email,
          password: createdUser.password,
        }),
      });

      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está registrado.",
        action: "Utilize outro endereço de e-mail para realizar esta operação.",
        status_code: 400,
      });
    });
  });
});
