import migrationRunner from "node-pg-migrate";
import { createRouter } from "next-connect";
import { resolve } from "node:path";
import database from "infra/database.js";
import controller from "infra/controller.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.get(getHandler);
router.post(postHandler);

let dbClient;

const migrationSettings = {
  databaseUrl: process.env.DATABASE_URL,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  pgmigrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  try {
    dbClient = await database.getDbClient();

    const pendingMigrations = await migrationRunner({
      ...migrationSettings,
      dbClient,
      dryRun: true,
    });

    return response.json(pendingMigrations);
  } finally {
    await dbClient.end();
  }
}
async function postHandler(request, response) {
  try {
    dbClient = await database.getDbClient();

    const executedMigrations = await migrationRunner({
      ...migrationSettings,
      dbClient,
    });

    if (executedMigrations.length > 0) {
      return response.status(201).json(executedMigrations);
    }

    return response.status(200).json(executedMigrations);
  } finally {
    await dbClient.end();
  }
}
