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

describe("[PATCH] /api/v1/users/[username]/", () => {
  describe("Anonymous user", () => {
    test("it should not be able to change an unexistent user", async () => {
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

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({
        name: "NotFoundError",
        message: "Não foi possível localizar o usuário informado.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    });

    test("it should not be able to change to a duplicated username", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
          email: "user1@example.com",
          password: "strongpassword",
        }),
      });

      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user2",
          email: "user2@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({
        name: "ValidationError",
        message: "O username informado já está registrado.",
        action: "Utilize outro nome de usuário para realizar esta operação.",
        status_code: 400,
      });
    });

    test("it should not be able to change to a duplicated email", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email1",
          email: "email1@example.com",
          password: "strongpassword",
        }),
      });

      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email2",
          email: "email2@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/email2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email1@example.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está registrado.",
        action: "Utilize outro endereço de e-mail para realizar esta operação.",
        status_code: 400,
      });
    });

    test("it should be able to change an username", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "originalUsername",
          email: "originalUsername@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/originalUsername",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "updatedUsername",
          }),
        },
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toEqual({
        id: body.id,
        username: "updatedUsername",
        email: "originalUsername@example.com",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      expect(body.updated_at > body.created_at).toBe(true);
    });

    test("it should be able to change an email", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "orginalEmail",
          email: "orginalEmail@example.com",
          password: "strongpassword",
        }),
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/orginalEmail",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "updatedEmail@example.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toEqual({
        id: body.id,
        username: "orginalEmail",
        email: "updatedEmail@example.com",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      expect(body.updated_at > body.created_at).toBe(true);
    });

    test("it should be able to change the password", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "oldPassword",
          email: "oldPassword@example.com",
          password: "oldPassword",
        }),
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/oldPassword",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword",
          }),
        },
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toEqual({
        id: body.id,
        username: "oldPassword",
        email: "oldPassword@example.com",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      expect(body.updated_at > body.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(body.username);
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
});
