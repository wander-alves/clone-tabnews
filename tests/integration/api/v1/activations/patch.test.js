import { version as uuidVersion } from "uuid";

import activation from "models/activation";
import orchestrator from "tests/orchestrator.js";
import user from "models/user";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[PATCH] /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("it should not be able to activate an user with inexistent activation token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/883e22d2-c551-4ef3-b535-2321a98524fb",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({
        name: "NotFoundError",
        message: "O token de ativação não foi localizado ou está expirado.",
        action: "É necessário refazer o processo de cadastro.",
        status_code: 404,
      });
    });

    test("it should not be able to activate an user with expired activation token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({
        name: "NotFoundError",
        message: "O token de ativação não foi localizado ou está expirado.",
        action: "É necessário refazer o processo de cadastro.",
        status_code: 404,
      });
    });

    test("it should not be able to activate an user with already used activation token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(200);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({
        name: "NotFoundError",
        message: "O token de ativação não foi localizado ou está expirado.",
        action: "É necessário refazer o processo de cadastro.",
        status_code: 404,
      });
    });

    test("it should be able to activate an user with valid activation token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toEqual({
        id: body.id,
        used_at: body.used_at,
        user_id: body.user_id,
        expires_at: body.expires_at,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });

      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.used_at)).not.toBeNaN();
      expect(Date.parse(body.expires_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      const expiresAt = new Date(body.expires_at);
      const createdAt = new Date(body.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBeLessThanOrEqual(
        activation.EXPIRATION_IN_MILLISECONDS,
      );

      const activatedUser = await user.findOneById(body.user_id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });
  });

  describe("Generic user", () => {
    test("it should not be able to activate an user with valid token from another user", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(user1.id);
      const user1SessionToken = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1SessionToken.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const body = await response.json();

      expect(body).toEqual({
        name: "ForbiddenError",
        message: "O usuário não possui permissão para executar esta ação.",
        action: `Verifique se seu usuário possui a feature: "read:activation_token"`,
        status_code: 403,
      });
    });
  });
});
