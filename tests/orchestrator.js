import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session";

const emailServiceURL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw new Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailServiceURL);

      if (response.status !== 200) {
        throw new Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userInputObject) {
  const createdUser = await user.create({
    username:
      userInputObject?.username ||
      faker.internet.username().replace(/[_.-]/g, ""),
    email: userInputObject?.email || faker.internet.email(),
    password: userInputObject?.password || "strongpassword",
  });
  return createdUser;
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${emailServiceURL}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailServiceURL}/messages`);
  const emailListBody = await emailListResponse.json();

  let lastEmailItem = emailListBody.pop();

  const lastEmailContentResponse = await fetch(
    `${emailServiceURL}/messages/${lastEmailItem.id}.plain`,
  );
  const lastEmailBody = await lastEmailContentResponse.text();

  lastEmailItem.text = lastEmailBody;
  return lastEmailItem;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
