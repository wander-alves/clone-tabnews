import activation from "models/activation";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessful)", () => {
  let body;
  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@example.com",
        password: "strongone",
      }),
    });

    body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      id: body.id,
      username: "RegistrationFlow",
      email: "registration.flow@example.com",
      password: body.password,
      features: ["read:activation_token"],
      created_at: body.created_at,
      updated_at: body.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toEqual("<activation@example.local>");
    expect(lastEmail.recipients[0]).toEqual("<registration.flow@example.com>");
    expect(lastEmail.subject).toEqual("Activate your account");
    expect(lastEmail.text).toContain("RegistrationFlow");

    const tokenId = orchestrator.extractUUIDFromText(lastEmail.text);
    const activationToken = await activation.findOneByValidToken(tokenId);

    expect(activationToken.user_id).toBe(body.id);
    expect(activationToken.used_at).toBe(null);
  });

  test("Activate account", async () => {});
  test("Login", async () => {});
  test("Get user information", async () => {});
});
