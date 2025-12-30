import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await database.query("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[GET] /api/v1/migrations", ()=> {
  describe("Anonymous user", ()=> {
    test("it should retrieve pending migrations when requested", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
    
      expect(response.status).toBe(200);
    
      const responseBody = await response.json();
    
      expect(Array.isArray(responseBody)).toEqual(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
})
