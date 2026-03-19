import { createRouter } from "next-connect";

import controller from "infra/controller";
import user from "models/user";
import session from "models/session";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.get(getHandler);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneByValidToken(sessionToken);

  await session.renew(sessionObject.id);

  controller.setSessionCookie(sessionObject.token, response);

  const userFound = await user.findOneById(sessionObject.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  return response.status(200).send(userFound);
}
