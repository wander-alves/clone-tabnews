import webserver from "infra/webserver.js";
import orchestrator from "tests/orchestrator.js";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[GET] /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("it should return current endpoint status with anonymous user", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const parsedDate = new Date(responseBody.updated_at).toISOString();

      expect(responseBody.updated_at).toEqual(parsedDate);

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("it should return current endpoint status when requested", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser.id, ["read:status:all"]);
      const userSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const parsedDate = new Date(responseBody.updated_at).toISOString();

      expect(responseBody.updated_at).toEqual(parsedDate);

      expect(responseBody.dependencies.database.version).toEqual("16.0");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
