import database from "infra/database.js";
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

async function migrations(request, response) {
  const dbClient = await database.getDbClient();

  const migrationSettings = {
    dbClient,
    databaseUrl: process.env.DATABASE_URL,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    pgmigrationsTable: "pgmigrations",
  };

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner({
      ...migrationSettings,
      dryRun: true,
    });

    await dbClient.end();

    return response.json(pendingMigrations);
  }

  if (request.method === "POST") {
    const executedMigrations = await migrationRunner(migrationSettings);

    await dbClient.end();

    if (executedMigrations.length > 0) {
      return response.status(201).json(executedMigrations);
    }

    return response.status(200).json(executedMigrations);
  }

  return response.status(405).send();
}

export default migrations;
