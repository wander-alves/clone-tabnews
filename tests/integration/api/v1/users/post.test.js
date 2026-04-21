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

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "john.doe",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername(
        responseBody.username,
      );
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

    test("it should not be able to register a duplicated `username`", async () => {
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

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está registrado.",
        action: "Utilize outro nome de usuário para realizar esta operação.",
        status_code: 400,
      });
    });

    test("it should not be able to register a duplicated `email`", async () => {
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

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está registrado.",
        action: "Utilize outro endereço de e-mail para realizar esta operação.",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("it should not be able to register an user with a active session", async () => {
      const user = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(user.id);
      const userSession = await orchestrator.createSession(user.id);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userSession.token}`,
        },
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          password: user.password,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "O usuário não possui permissão para executar esta ação.",
        action: `Verifique se seu usuário possui a feature: "create:user"`,
        status_code: 403,
      });
    });
  });
});
