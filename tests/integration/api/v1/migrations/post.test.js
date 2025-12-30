import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

async function cleanDatabase() {
  await orchestrator.waitForAllServices();
  await database.query("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
}

beforeAll(async () => {
  await cleanDatabase();
});

describe("[POST] /api/v1/migrations", ()=>{
  describe("Anonymous user", ()=>{
    test("it should run migrations when requested", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toEqual(true);
      expect(responseBody.length).toBeGreaterThan(0);
  });
  test("it should not run migrations if there are none pending", async ()=>{
     const response = await fetch(
        "http://localhost:3000/api/v1/migrations",
        {
          method: "POST",
        },
      );

      const responseBody = await response.json();
            
      expect(response.status).toBe(200);
      expect(responseBody.length).toBe(0);
    });
  })
})

