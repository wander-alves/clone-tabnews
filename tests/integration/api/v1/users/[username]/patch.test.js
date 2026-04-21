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

describe("[PATCH] /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("it should not be able to edit an user when are not authenticated", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/inexistentUser",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "inexistentUser",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        action: `Verifique se seu usuário possui a feature: "update:user"`,
        message: "O usuário não possui permissão para executar esta ação.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("it should not be able to change an unexistent user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/inexistentUser",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "inexistentUser",
          }),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Não foi possível localizar o usuário informado.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    });

    test("it should not be able to change to a duplicated `username`", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const user2 = await orchestrator.createUser({
        username: "user2",
      });
      await orchestrator.activateUserByUserId(user2.id);
      const sessionObject = await orchestrator.createSession(user2.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está registrado.",
        action: "Utilize outro nome de usuário para realizar esta operação.",
        status_code: 400,
      });
    });

    test("it should not be able to change to a duplicated email", async () => {
      await orchestrator.createUser({
        email: "email1@example.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@example.com",
      });
      await orchestrator.activateUserByUserId(createdUser2.id);
      const sessionObject = await orchestrator.createSession(createdUser2.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "email1@example.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está registrado.",
        action: "Utilize outro endereço de e-mail para realizar esta operação.",
        status_code: 400,
      });
    });

    test("it should not be able to change an user from different account", async () => {
      const userA = await orchestrator.createUser({
        username: "userA",
      });
      const userB = await orchestrator.createUser({
        username: "userB",
      });
      await orchestrator.activateUserByUserId(userB.id);
      const sessionObject = await orchestrator.createSession(userB.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userA.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "userC",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Sua conta não possui permissão para atualizar outro usuário.",
        action:
          "Verifique se sua conta possui a feature necessária para atualizar outro usuário",
        status_code: 403,
      });
    });

    test("it should be able to change an `username`", async () => {
      const createdUser = await orchestrator.createUser({
        username: "originalUsername",
      });
      await orchestrator.activateUserByUserId(createdUser.id);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "updatedUsername",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "updatedUsername",
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("it should be able to change an `email`", async () => {
      const createdUser = await orchestrator.createUser({
        email: "orginalEmail@example.com",
      });
      await orchestrator.activateUserByUserId(createdUser.id);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "updatedEmail@example.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const updatedUser = await user.findOneById(responseBody.id);
      expect(updatedUser.email).toEqual("updatedEmail@example.com");
    });

    test("it should be able to change the `password`", async () => {
      const createdUser = await orchestrator.createUser({
        password: "oldPassword",
      });
      await orchestrator.activateUserByUserId(createdUser.id);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        responseBody.username,
      );
      const correctPasswordMatch = await password.compare(
        "newPassword",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "oldPassword",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Privileged user", () => {
    test("it should be able to change another user with `update:user:others` `feature`", async () => {
      const privilegedUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(privilegedUser.id);
      await orchestrator.addFeaturesToUser(privilegedUser.id, [
        "update:user:others",
      ]);
      const privilegedSession = await orchestrator.createSession(
        privilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedSession.token}`,
          },
          method: "PATCH",
          body: JSON.stringify({
            username: "UpdatedByPrivilegedUser",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: "UpdatedByPrivilegedUser",
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
