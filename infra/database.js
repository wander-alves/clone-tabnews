import { Client } from "pg";
import { ServiceError } from "./errors.js";

export async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: getSSLValues(),
  });
  await client.connect();

  return client;
}

async function query(queryObject) {
  let client;

  try {
    client = await getDbClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    const serviceErrorObj = new ServiceError({
      message: "Ocorreu um erro na conexão com o Banco ou na Query.",
      cause: error,
    });
    throw serviceErrorObj;
  } finally {
    await client?.end();
  }
}

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }
  return process.env.NODE_ENV === "production" ? true : false;
}

const database = {
  query,
  getDbClient,
};

export default database;
