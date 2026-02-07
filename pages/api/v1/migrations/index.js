import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import migrator from "models/migrator.js";

const router = createRouter();

export default router.handler(controller.errorHandlers);

router.get(getHandler);
router.post(postHandler);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();

  return response.json(pendingMigrations);
}

async function postHandler(request, response) {
  const executedMigrations = await migrator.runPendingMigrations();

  if (executedMigrations.length > 0) {
    return response.status(201).json(executedMigrations);
  }

  return response.status(200).json(executedMigrations);
}
