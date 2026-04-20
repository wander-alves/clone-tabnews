import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;

  const activationToken = await activation.findOneByValidToken(tokenId);

  await activation.activateUserByUserId(activationToken.user_id);

  const usedActivationToken = await activation.markTokenAsUsed(tokenId);

  const contextUser = request.context.user;
  const secureObject = authorization.filterOutput(
    contextUser,
    "read:activation_token",
    usedActivationToken,
  );

  return response.status(200).json(secureObject);
}
