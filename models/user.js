import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create({ username, email, password }) {
  await validateUniqueEmail(email);
  await validateUniqueUsername(username);

  const newUser = await runInsertQuery({ username, email, password });

  return newUser;

  async function validateUniqueEmail(email) {
    const result = await database.query({
      text: `
        SELECT
          email
        FROM 
          users
        WHERE
          LOWER(email) = LOWER($1)
      ;`,
      values: [email],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "O e-mail informado já está registrado.",
        action: "Utilize outro endereço de e-mail para realizar o cadastro.",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const result = await database.query({
      text: `
        SELECT
          username
        FROM 
          users
        WHERE
          LOWER(username) = LOWER($1)
      ;`,
      values: [username],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "O username informado já está registrado.",
        action: "Utilize outro endereço de usuário para realizar o cadastro.",
      });
    }
  }

  async function runInsertQuery({ username, email, password }) {
    const result = await database.query({
      text: `
        INSERT INTO users
          (username, email, password)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [username, email, password],
    });
    return result.rows[0];
  }
}

const user = {
  create,
};

export default user;
