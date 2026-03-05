import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.get(getHandler);
router.patch(patchHandler);

async function getHandler(request, response) {
  const username = request.query.username;

  const userFound = await user.findOneByUsername(username);

  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputObject = request.body;

  const updatedUser = await user.update(username, userInputObject);

  return response.status(200).json(updatedUser);
}
