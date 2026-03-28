import { Router } from "express";
import * as taskController from "@/controllers/task.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { checkApiKeyPermission } from "@/middlewares/api-key-permission.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/search", taskController.searchTasks);
router.get("/project/:projectId", taskController.getProjectTasks);
router.get("/:id", taskController.getTask);
router.post("/", checkApiKeyPermission("create"), taskController.createTask);
router.put("/", checkApiKeyPermission("edit"), taskController.updateTask);
router.put("/:id", checkApiKeyPermission("edit"), taskController.updateTask);
router.delete("/:id", checkApiKeyPermission("delete"), taskController.deleteTask);
router.put("/:id/status", taskController.updateTaskStatus);
router.put("/:id/order", taskController.reorderTask);
router.post("/:id/dependencies", taskController.addDependency);
router.delete("/:id/dependencies/:depId", taskController.removeDependency);

export default router;
