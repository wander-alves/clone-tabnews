import { InternalServerError } from "infra/errors.js";
import database from "/infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();
  try {
    const dbVersionQueryResult = await database.query("SHOW server_version;");

    const dbVersion = dbVersionQueryResult.rows[0].server_version;

    const dbMaxConnectionsQuery = await database.query("SHOW max_connections;");

    const dbMaxConnections = parseInt(
      dbMaxConnectionsQuery.rows[0].max_connections,
    );

    const databaseName = process.env.POSTGRES_DB;
    const dbOpenedConnectionsQuery = await database.query({
      text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname=$1;",
      values: [databaseName],
    });

    const dbOpenedConnections = dbOpenedConnectionsQuery.rows[0].count;

    return response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: dbVersion,
          max_connections: dbMaxConnections,
          opened_connections: dbOpenedConnections,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error
    })
    console.log("\n Erro dentro do catch do controller:");
    console.error(publicErrorObject);
    return response.status(500).json(publicErrorObject)
  }
  
}

export default status;
