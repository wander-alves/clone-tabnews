import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

import webserver from "infra/webserver.js";
import session from "models/session.js";
import orchestrator from "tests/orchestrator.js";
import dateConverter from "utils/date-converter.js";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[GET] /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("it should not be able to get user info without a session", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/user/`);

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "O usuário não possui permissão para executar esta ação.",
        action: `Verifique se seu usuário possui a feature: "read:session"`,
        status_code: 403,
      });
    });
  });

  describe("Generic user", () => {
    test("it should be able to get user info with valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "ValidSessionUser",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const updatedUser = await orchestrator.activateUserByUserId(
        createdUser.id,
      );

      const response = await fetch(`${webserver.origin}/api/v1/user/`, {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: updatedUser.id,
        username: "ValidSessionUser",
        email: updatedUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: updatedUser.created_at.toISOString(),
        updated_at: updatedUser.updated_at.toISOString(),
      });
      expect(uuidVersion(updatedUser.id)).toBe(4);
      expect(Date.parse(updatedUser.created_at)).not.toBeNaN();
      expect(Date.parse(updatedUser.updated_at)).not.toBeNaN();

      const renewedSession = await session.findOneByValidToken(
        createdSession.token,
      );

      expect(renewedSession.expires_at > createdSession.expires_at).toBe(true);
      expect(renewedSession.updated_at > createdSession.updated_at).toBe(true);

      const cookies = setCookieParser(response, {
        map: true,
      });

      expect(cookies.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        httpOnly: true,
        sameSite: "Lax",
      });
    });

    test("it should be able to get user info even if session is about to expire", async () => {
      const customExpirationDateInMilliseconds =
        dateConverter.getDayInMilliseconds(28);

      const dateNearToExpiresFromNow = new Date(
        Date.now() - customExpirationDateInMilliseconds,
      );

      jest.useFakeTimers({
        now: dateNearToExpiresFromNow,
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithTokenNearToExpire",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const updatedUser = await orchestrator.activateUserByUserId(
        createdUser.id,
      );

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user/`, {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const cacheControl = response.headers.get("Cache-Control");

      expect(cacheControl).toEqual(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithTokenNearToExpire",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: updatedUser.updated_at.toISOString(),
      });
      expect(uuidVersion(createdUser.id)).toBe(4);
      expect(Date.parse(createdUser.created_at)).not.toBeNaN();
      expect(Date.parse(createdUser.updated_at)).not.toBeNaN();

      const renewedSession = await session.findOneByValidToken(
        createdSession.token,
      );

      expect(renewedSession.expires_at > createdSession.expires_at).toBe(true);
      expect(renewedSession.updated_at > createdSession.updated_at).toBe(true);

      const cookies = setCookieParser(response, {
        map: true,
      });

      expect(cookies.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        httpOnly: true,
        sameSite: "Lax",
      });
    });

    test("it should not be able to get user data with invalid session", async () => {
      const invalidSessionToken = `9d960feed5be358fb0ad0830ecda97bdac388d18dd5c1281afae2169b99ccd50a9dfb3fb8515e644ae0a585e8c8edb04`;
      const response = await fetch(`${webserver.origin}/api/v1/user/`, {
        headers: {
          Cookie: `session_id=${invalidSessionToken}`,
        },
      });

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "O usuário não possui sessão ativa.",
        action: "Verifique se o usuário está autenticado e tente novamente.",
        status_code: 401,
      });
    });

    test("it should not be able to get user info with expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "ExpiredTokenUsername",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user/`, {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "O usuário não possui sessão ativa.",
        action: "Verifique se o usuário está autenticado e tente novamente.",
        status_code: 401,
      });

      const cookies = setCookieParser(response, {
        map: true,
      });

      expect(cookies.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        path: "/",
        maxAge: -1,
        httpOnly: true,
      });
    });
  });
});
