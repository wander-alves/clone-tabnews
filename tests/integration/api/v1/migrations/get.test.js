import orchestrator from "tests/orchestrator.js";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[GET] /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("it should not be able to retrieve pending migrations from anonymous user", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "O usuário não possui permissão para executar esta ação.",
        action: `Verifique se seu usuário possui a feature: "read:migration"`,
        status_code: 403,
      });
    });
  });

  describe("Generic user", () => {
    test("it should not be able to retrieve pending migrations from generic user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "O usuário não possui permissão para executar esta ação.",
        action: `Verifique se seu usuário possui a feature: "read:migration"`,
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("it should retrieve pending migrations when requested", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser.id, ["read:migration"]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toEqual(true);
      expect(responseBody.length).toBe(0);
    });
  });
});
