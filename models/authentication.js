import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findOneByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Autenticação inválida.",
        action: "Verifique os dados enviados estão corretos.",
      });
    }

    throw error;
  }

  async function findOneByEmail(providedEmail) {
    try {
      const storedUser = await user.findOneByEmail(providedEmail);
      return storedUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "E-mail fornecido não corresponde.",
          action: "Verifique se o dado informado está correto.",
        });
      }

      throw error;
    }
  }

  async function validatePassword(providedPassword, passwordHash) {
    const doesPasswordMatch = await password.compare(
      providedPassword,
      passwordHash,
    );

    if (!doesPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha fornecida não corresponde.",
        action: "Verifique se o dado informado está correto.",
      });
    }
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
