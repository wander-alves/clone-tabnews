import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test("[GET] should status endpoint point return 200 when requested.", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");

  expect(response.status).toBe(200);

  const body = await response.json();
  const parsedDate = new Date(body.updated_at).toISOString();

  expect(body.updated_at).toEqual(parsedDate);

  expect(body.dependencies.database.version).toEqual("16.0");
  expect(body.dependencies.database.max_connections).toEqual(100);
  expect(body.dependencies.database.opened_connections).toEqual(1);
});
