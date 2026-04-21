import orchestrator from "tests/orchestrator.js";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[POST] /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("it should not run migrations with anonymous user", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "O usuário não possui permissão para executar esta ação.",
        action: `Verifique se seu usuário possui a feature: "create:migration"`,
        status_code: 403,
      });
    });
  });

  describe("Generic user", () => {
    test("it should not run migrations with generic user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "O usuário não possui permissão para executar esta ação.",
        action: `Verifique se seu usuário possui a feature: "create:migration"`,
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("it should retrive pending migrations if there are none pending", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser.id, [
        "create:migration",
      ]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.length).toBe(0);
    });
  });
});
