import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneByValidToken(sessionToken);
  const expiredSession = await session.revokeById(sessionObject.id);

  controller.clearSessionCookie(response);

  return response.status(200).json(expiredSession);
}
