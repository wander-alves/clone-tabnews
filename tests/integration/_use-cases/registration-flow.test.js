import webserver from "infra/webserver.js";
import activation from "models/activation.js";
import user from "models/user.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessful)", () => {
  let body;
  let tokenId;
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

    tokenId = orchestrator.extractUUIDFromText(lastEmail.text);
    const activationToken = await activation.findOneByValidToken(tokenId);

    expect(activationToken.user_id).toBe(body.id);
    expect(activationToken.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const response = await fetch(
      `${webserver.origin}/api/v1/activations/${tokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(Date.parse(responseBody.used_at)).not.toBeNaN();

    const activatedAccount = await user.findOneByUsername("RegistrationFlow");

    expect(activatedAccount.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "registration.flow@example.com",
        password: "strongone",
      }),
    });

    expect(response.status).toBe(201);

    const requestLoginBody = await response.json();
    expect(requestLoginBody.user_id).toEqual(body.id);
  });

  test("Get user information", async () => {
    const createdSession = await orchestrator.createSession(body.id);

    const response = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        Cookie: `session_id=${createdSession.token}`,
      },
    });

    const requestUserSessionBody = await response.json();
    expect(response.status).toBe(200);
    expect(requestUserSessionBody.id).toEqual(body.id);
  });
});
