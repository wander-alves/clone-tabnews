import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("[POST] /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("it should return an error when endpoint receives a not allowed method", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });

      expect(response.status).toBe(405);

      const body = await response.json();
      expect(body).toEqual({
        name: "MethodNotAllowedError",
        message: "O método utilizado não é suportado pelo endpoint.",
        action: "Verifique se o método HTTP é permitido para o endpoint.",
        status_code: 405,
      });
    });
  });
});
