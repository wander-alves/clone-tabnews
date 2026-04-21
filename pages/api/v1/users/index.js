import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";
import user from "models/user.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);

  await activation.sendEmailToUser(newUser, activationToken);

  const contextUser = request.context.user;

  const secureOutput = authorization.filterOutput(
    contextUser,
    "read:user",
    newUser,
  );

  return response.status(201).json(secureOutput);
}
