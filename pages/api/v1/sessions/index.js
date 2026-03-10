import { createRouter } from "next-connect";
import * as cookie from "cookie";

import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.post(postHandler);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  const sessionCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", sessionCookie);

  return response.status(201).json(newSession);
}
