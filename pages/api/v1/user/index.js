import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import authorization from "models/authorization.js";
import session from "models/session.js";
import user from "models/user.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneByValidToken(sessionToken);

  await session.renew(sessionObject.id);

  controller.setSessionCookie(sessionObject.token, response);

  const userFound = await user.findOneById(sessionObject.user_id);

  const contextUser = request.context.user;

  const secureOutput = authorization.filterOutput(
    contextUser,
    "read:user:self",
    userFound,
  );

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  return response.status(200).send(secureOutput);
}
