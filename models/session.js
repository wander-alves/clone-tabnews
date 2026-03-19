import { randomBytes } from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = getDayInMilliseconds(30);

async function create(userId) {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newSession = await runInsertQuery(token, userId, expiresAt);

  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO sessions
          (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function renew(sessionId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const renewedSessionObject = await runUpdateQuery(sessionId, expiresAt);

  return renewedSessionObject;

  async function runUpdateQuery(sessionId, expiresAt) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id=$1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return result.rows[0];
  }
}

async function findOneByValidToken(sessionToken) {
  const sessionFound = await runSelectQuery(sessionToken);

  return sessionFound;

  async function runSelectQuery(sessionToken) {
    const result = await database.query({
      text: `
        SELECT 
          *
        FROM
          sessions
        WHERE
          token=$1
          AND
            expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [sessionToken],
    });

    if (result.rows == 0) {
      throw new UnauthorizedError({
        message: "O usuário não possui sessão ativa.",
        action: "Verifique se o usuário está autenticado e tente novamente.",
      });
    }

    return result.rows[0];
  }
}

function getDayInMilliseconds(dayAmount) {
  const secondInMs = 1000;
  const minuteInSecs = 60;
  const hourInMins = 60;
  const dayInHrs = 24;

  const result = secondInMs * minuteInSecs * hourInMins * dayInHrs * dayAmount;

  return result;
}

const session = {
  create,
  findOneByValidToken,
  renew,
  EXPIRATION_IN_MILLISECONDS,
  getDayInMilliseconds,
};

export default session;
