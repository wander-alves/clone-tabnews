import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";

let dbClient;

const migrationSettings = {
  databaseUrl: process.env.DATABASE_URL,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  pgmigrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  try {
    dbClient = await database.getDbClient();

    const pendingMigrations = await migrationRunner({
      ...migrationSettings,
      dbClient,
      dryRun: true,
    });

    return pendingMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  try {
    dbClient = await database.getDbClient();

    const executedMigrations = await migrationRunner({
      ...migrationSettings,
      dbClient,
    });

    return executedMigrations;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
