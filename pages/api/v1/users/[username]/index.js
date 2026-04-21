import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import authorization from "models/authorization.js";
import user from "models/user.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

async function getHandler(request, response) {
  const contextUser = request.context.user;
  const username = request.query.username;

  const targetUser = await user.findOneByUsername(username);

  const secureOutput = authorization.filterOutput(
    contextUser,
    "read:user",
    targetUser,
  );

  return response.status(200).json(secureOutput);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputObject = request.body;

  const contextUser = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(contextUser, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Sua conta não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se sua conta possui a feature necessária para atualizar outro usuário",
    });
  }

  const updatedUser = await user.update(username, userInputObject);

  const secureOutput = authorization.filterOutput(
    contextUser,
    "read:user",
    updatedUser,
  );

  return response.status(200).json(secureOutput);
}
