import { Router } from "express";
import * as taskHierarchyController from "@/controllers/task-hierarchy.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:id/subtasks", taskHierarchyController.getSubtasks);
router.post("/:id/subtasks", taskHierarchyController.createSubtask);
router.put("/:id/parent", taskHierarchyController.moveTask);

router.post("/merge-preview", taskHierarchyController.mergePreview);
router.post("/merge", taskHierarchyController.mergeTasks);

router.post("/:id/split", taskHierarchyController.splitTask);

router.post("/convert-to-project", taskHierarchyController.convertToProject);

export default router;
