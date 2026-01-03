import database from "infra/database.js";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";

async function migrations(request, response) {
  const allowedMethods = ["POST", "GET"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Unauthorized method: ${request.method}`,
    });
  }

  let dbClient;

  const migrationSettings = {
    dbClient,
    databaseUrl: process.env.DATABASE_URL,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    pgmigrationsTable: "pgmigrations",
  };

  try {
    dbClient = await database.getDbClient();

    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner({
        ...migrationSettings,
        dryRun: true,
      });

      return response.json(pendingMigrations);
    }

    if (request.method === "POST") {
      const executedMigrations = await migrationRunner(migrationSettings);

      if (executedMigrations.length > 0) {
        return response.status(201).json(executedMigrations);
      }

      return response.status(200).json(executedMigrations);
    }
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

export default migrations;
