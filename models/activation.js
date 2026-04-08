import email from "infra/email.js";
import database from "infra/database.js";
import dateConverter from "utils/date-converter";
import webserver from "infra/webserver.js";
import { UnauthorizedError } from "infra/errors";

async function create(userId) {
  const EXPIRATION_IN_MILLISECONDS = dateConverter.getMinutesInMilliseconds(15);
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const activationToken = await runInsertQuery(userId, expiresAt);

  return activationToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO 
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function findOneByValidToken(tokenId) {
  const activationToken = await runSelectQuery(tokenId);
  return activationToken;

  async function runSelectQuery(tokenId) {
    const result = await database.query({
      text: `
        SELECT 
          *
        FROM 
          user_activation_tokens
        WHERE
          id=$1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    if (result.rows == 0) {
      throw new UnauthorizedError({
        message: "O token de ativação não foi localizado ou está expirado.",
        action: "É necessário refazer o processo de cadastro.",
      });
    }

    return result.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Account Activation <activation@example.local>",
    to: user.email,
    subject: "Activate your account",
    text: `Hi, @${user.username}!

Welcome to our portal. To start to use our services, you must activate your account with activation link bellow.

${webserver.origin}/accounts/activate/${activationToken.id}

Best regards,

Support Example Local Inc.
`,
  });
}

const activation = {
  sendEmailToUser,
  create,
  findOneByValidToken,
};

export default activation;
