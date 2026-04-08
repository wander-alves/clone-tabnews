import database from "infra/database.js";
import password from "./password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(userInputObject) {
  await validateUniqueUsername(userInputObject.username);
  await validateUniqueEmail(userInputObject.email);
  await hashPasswordInObject(userInputObject);
  injectDefaultFeaturesInObject(userInputObject);

  const newUser = await runInsertQuery(userInputObject);

  return newUser;

  async function runInsertQuery({ username, email, password, features }) {
    const result = await database.query({
      text: `
        INSERT INTO users
          (username, email, password, features)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
      ;`,
      values: [username, email, password, features],
    });
    return result.rows[0];
  }

  function injectDefaultFeaturesInObject(userInputObject) {
    userInputObject.features = ["read:activation_token"];
  }
}

async function update(username, userInputObject) {
  const userFound = await findOneByUsername(username);

  if (userInputObject.username) {
    await validateUniqueUsername(userInputObject.username);
  }

  if (userInputObject.email) {
    await validateUniqueEmail(userInputObject.email);
  }

  if (userInputObject.password) {
    await hashPasswordInObject(userInputObject);
  }

  const userWithUpdatedValues = { ...userFound, ...userInputObject };

  const updatedUser = await runUpdateQuery(userWithUpdatedValues);

  return updatedUser;

  async function runUpdateQuery({ id, username, email, password }) {
    const result = await database.query({
      text: `
        UPDATE 
          users
        SET
          username = $2,
          email =  $3,
          password =  $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [id, username, email, password],
    });
    return result.rows[0];
  }
}

async function findOneById(userId) {
  const userFound = await runSelectQuery(userId);

  return userFound;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM 
          users
        WHERE
          id = $1
        LIMIT
          1
      ;`,
      values: [userId],
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

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

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

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM 
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
      ;`,
      values: [email],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "Não foi possível localizar o usuário informado.",
        action: "Verifique o email informado e tente novamente.",
      });
    }

    return result.rows[0];
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
      action: "Utilize outro nome de usuário para realizar esta operação.",
    });
  }
}

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
      action: "Utilize outro endereço de e-mail para realizar esta operação.",
    });
  }
}

async function hashPasswordInObject(userInputObject) {
  const hashedPassword = await password.hash(userInputObject.password);
  userInputObject.password = hashedPassword;
}

async function setFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const result = await database.query({
      text: `
        UPDATE
          users
        SET
          features=$2,
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [userId, features],
    });

    return result.rows[0];
  }
}

const user = {
  create,
  update,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  setFeatures,
};

export default user;
