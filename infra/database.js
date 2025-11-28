import { Client } from "pg";

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
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
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
