import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import migrator from "models/migrator.js";
import authorization from "models/authorization.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:migration"), getHandler);
router.post(controller.canRequest("create:migration"), postHandler);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();

  const contextUser = request.context.user;
  const secureOutput = authorization.filterOutput(
    contextUser,
    "read:migration",
    pendingMigrations,
  );

  return response.json(secureOutput);
}

async function postHandler(request, response) {
  const executedMigrations = await migrator.runPendingMigrations();

  const contextUser = request.context.user;
  const secureOutput = authorization.filterOutput(
    contextUser,
    "read:migration",
    executedMigrations,
  );

  if (executedMigrations.length > 0) {
    return response.status(201).json(secureOutput);
  }

  return response.status(200).json(secureOutput);
}
