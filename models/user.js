import database from "infra/database.js";
import password from "./password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(userInputObject) {
  await validateUniqueEmail(userInputObject.email);
  await validateUniqueUsername(userInputObject.username);
  await hashPasswordInObject(userInputObject);

  const newUser = await runInsertQuery(userInputObject);

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

  async function hashPasswordInObject(userInputObject) {
    const hashedPassword = await password.hash(userInputObject.password);
    userInputObject.password = hashedPassword;
  }
}

async function findOneByUsername(username) {
  const newUser = await runSelectQuery(username);

  return newUser;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM 
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
      ;`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "Não foi possível localizar o usuário informado.",
        action: "Verifique o username informado e tente novamente.",
      });
    }

    return result.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
