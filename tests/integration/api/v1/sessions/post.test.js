import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

import orchestrator from "tests/orchestrator.js";
import session from "models/session";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[POST] /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("it should not be able to create a session with wrong e-mail and correct password", async () => {
      await orchestrator.createUser({
        password: "valid-password",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid-email@example.com",
          password: "valid-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Autenticação inválida.",
        action: "Verifique os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("it should not be able to create a session with correct e-mail and wrong password", async () => {
      await orchestrator.createUser({
        email: "valid-email@example.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "valid-email@example.com",
          password: "wrong-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Autenticação inválida.",
        action: "Verifique os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("it should not be able to create a session with wrong e-mail and wrong password", async () => {
      await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "wrong-email@example.com",
          password: "wrong-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Autenticação inválida.",
        action: "Verifique os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("it should be able to create a session with currect e-mail and password", async () => {
      const storedUser = await orchestrator.createUser({
        email: "correct.email@example.com",
        password: "correctpassword",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correct.email@example.com",
          password: "correctpassword",
        }),
      });

      expect(response.status).toBe(201);

      const body = await response.json();

      expect(body).toEqual({
        id: body.id,
        token: body.token,
        user_id: storedUser.id,
        expires_at: body.expires_at,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });

      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.expires_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      const expiresAt = new Date(body.expires_at);
      const createdAt = new Date(body.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBeLessThanOrEqual(
        session.EXPIRATION_IN_MILLISECONDS,
      );

      const cookies = setCookieParser(response, {
        map: true,
      });

      expect(cookies.session_id).toEqual({
        name: "session_id",
        value: body.token,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        httpOnly: true,
      });
    });
  });
});
