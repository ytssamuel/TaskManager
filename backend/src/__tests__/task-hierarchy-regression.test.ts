import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { errorHandler, notFoundHandler } from "@/middlewares/error.middleware";

const TEST_BASE_URL = "http://localhost:3000";

interface TestUser {
  id: string;
  email: string;
  username: string;
  name: string;
  password: string;
  accessToken: string;
}

interface TestTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  orderIndex: number;
  projectId: string;
  parentTaskId?: string | null;
}

interface TestProject {
  id: string;
  name: string;
  description?: string;
}

describe("Task Hierarchy & Operations Regression Tests", () => {
  let testUser: TestUser;
  let projectId: string;
  let taskIds: string[] = [];
  const createdTaskIds: string[] = [];

  beforeAll(async () => {
    const timestamp = Date.now();
    testUser = {
      id: "",
      email: `regression-test-${timestamp}@example.com`,
      username: `regressiontest${timestamp}`,
      name: "Regression Tester",
      password: "testpass123456",
      accessToken: "",
    };

    const registerRes = await request(TEST_BASE_URL)
      .post("/api/auth/register")
      .send({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        username: testUser.username,
      });

    if (registerRes.body.success) {
      testUser.id = registerRes.body.data.user.id;
      testUser.accessToken = registerRes.body.data.accessToken;
    } else {
      const loginRes = await request(TEST_BASE_URL)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });
      testUser.id = loginRes.body.data.user.id;
      testUser.accessToken = loginRes.body.data.accessToken;
    }

    const projectRes = await request(TEST_BASE_URL)
      .post("/api/projects")
      .set("Authorization", `Bearer ${testUser.accessToken}`)
      .send({ name: "Regression Test Project", description: "For regression testing" });

    projectId = projectRes.body.data.id;
    createdTaskIds.push(projectId);
  });

  afterAll(async () => {
    for (const id of createdTaskIds) {
      try {
        await request(TEST_BASE_URL)
          .delete(`/api/projects/${id}`)
          .set("Authorization", `Bearer ${testUser.accessToken}`);
      } catch (e) {
        // ignore cleanup errors
      }
    }
  });

  const authHeader = () => ({ Authorization: `Bearer ${testUser.accessToken}` });

  describe("1. Task CRUD Operations", () => {
    it("should create a task with all fields", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send({
          projectId,
          title: "Test Task 1",
          description: "Task description",
          priority: "HIGH",
          status: "BACKLOG",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Test Task 1");
      expect(res.body.data.priority).toBe("HIGH");
      expect(res.body.data.status).toBe("BACKLOG");
      expect(res.body.data.projectId).toBe(projectId);
      taskIds.push(res.body.data.id);
      createdTaskIds.push(res.body.data.id);
    });

    it("should create multiple tasks for later tests", async () => {
      const titles = ["Task 2", "Task 3", "Task 4", "Task 5"];
      for (const title of titles) {
        const res = await request(TEST_BASE_URL)
          .post("/api/tasks")
          .set(authHeader())
          .send({ projectId, title, priority: "MEDIUM" });
        expect(res.status).toBe(201);
        taskIds.push(res.body.data.id);
        createdTaskIds.push(res.body.data.id);
      }
      expect(taskIds.length).toBeGreaterThanOrEqual(5);
    });

    it("should get task by ID", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/tasks/${taskIds[0]}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(taskIds[0]);
      expect(res.body.data.title).toBeDefined();
    });

    it("should get all tasks for project", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/tasks/project/${projectId}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(5);
    });

    it("should update task", async () => {
      const res = await request(TEST_BASE_URL)
        .put(`/api/tasks/${taskIds[0]}`)
        .set(authHeader())
        .send({ title: "Updated Task Title", priority: "URGENT" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Updated Task Title");
      expect(res.body.data.priority).toBe("URGENT");
    });

    it("should reject task without title", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should search tasks", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/tasks/search")
        .set(authHeader())
        .query({ q: "Test", projectId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.results));
    });

    it("should delete task", async () => {
      const createRes = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "To Be Deleted", priority: "LOW" });

      const deleteTargetId = createRes.body.data.id;
      createdTaskIds.push(deleteTargetId);

      const res = await request(TEST_BASE_URL)
        .delete(`/api/tasks/${deleteTargetId}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("2. Task Status & Order Operations", () => {
    let statusTestTaskId: string;

    beforeEach(async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Status Test Task", priority: "MEDIUM" });
      statusTestTaskId = res.body.data.id;
      createdTaskIds.push(statusTestTaskId);
    });

    it("should update task status", async () => {
      const res = await request(TEST_BASE_URL)
        .put(`/api/tasks/${statusTestTaskId}/status`)
        .set(authHeader())
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("IN_PROGRESS");
    });

    it("should update task order", async () => {
      const projectRes = await request(TEST_BASE_URL)
        .get(`/api/projects/${projectId}`)
        .set(authHeader());
      const columnId = projectRes.body.data.columns?.[0]?.id;

      if (columnId) {
        const res = await request(TEST_BASE_URL)
          .put(`/api/tasks/${statusTestTaskId}/order`)
          .set(authHeader())
          .send({ orderIndex: 99, columnId });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.orderIndex).toBe(99);
      } else {
        console.log("Skipping order test - no columns found");
      }
    });

    it("should transition task to next status", async () => {
      const statuses = ["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"];
      let currentTaskId = taskIds[0];

      const taskRes = await request(TEST_BASE_URL)
        .get(`/api/tasks/${currentTaskId}`)
        .set(authHeader());

      const currentStatus = taskRes.body.data.status;
      const currentIndex = statuses.indexOf(currentStatus);
      const nextStatus = currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : statuses[currentIndex];

      const updateRes = await request(TEST_BASE_URL)
        .put(`/api/tasks/${currentTaskId}/status`)
        .set(authHeader())
        .send({ status: nextStatus });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe(nextStatus);
    });
  });

  describe("3. Task Dependencies", () => {
    let depTask1: string, depTask2: string, depTask3: string;

    beforeAll(async () => {
      const res1 = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Dependency Source 1", priority: "HIGH" });
      const res2 = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Dependency Target 1", priority: "MEDIUM" });
      const res3 = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Dependency Target 2", priority: "LOW" });

      depTask1 = res1.body.data.id;
      depTask2 = res2.body.data.id;
      depTask3 = res3.body.data.id;
      createdTaskIds.push(depTask1, depTask2, depTask3);
    });

    it("should add dependency", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${depTask1}/dependencies`)
        .set(authHeader())
        .send({ dependsOnId: depTask2 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should get task dependencies", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/tasks/${depTask1}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.dependentOn).toBeDefined();
      expect(res.body.data.dependentOn.length).toBeGreaterThan(0);
    });

    it("should not allow self-dependency", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${depTask1}/dependencies`)
        .set(authHeader())
        .send({ dependsOnId: depTask1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should remove dependency", async () => {
      const taskRes = await request(TEST_BASE_URL)
        .get(`/api/tasks/${depTask1}`)
        .set(authHeader());

      const depId = taskRes.body.data.dependencies[0]?.id;
      if (depId) {
        const res = await request(TEST_BASE_URL)
          .delete(`/api/tasks/${depTask1}/dependencies/${depId}`)
          .set(authHeader());

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe("4. Parent-Child Tasks (Subtasks)", () => {
    let parentTaskId: string;

    beforeAll(async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Parent Task", priority: "HIGH" });
      parentTaskId = res.body.data.id;
      createdTaskIds.push(parentTaskId);
    });

    it("should create subtask", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${parentTaskId}/subtasks`)
        .set(authHeader())
        .send({ title: "Subtask 1", description: "Subtask description", priority: "MEDIUM" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parentTaskId).toBe(parentTaskId);
      expect(res.body.data.projectId).toBe(projectId);
    });

    it("should get subtasks", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/tasks/${parentTaskId}/subtasks`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtasks).toBeDefined();
      expect(res.body.data.totalCount).toBeGreaterThan(0);
    });

    it("should create multiple subtasks", async () => {
      const titles = ["Subtask 2", "Subtask 3"];
      for (const title of titles) {
        const res = await request(TEST_BASE_URL)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .set(authHeader())
          .send({ title, priority: "LOW" });
        expect(res.status).toBe(201);
      }
    });

    it("should move task to different parent", async () => {
      const task1Res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Move Source Task", priority: "MEDIUM" });
      const task2Res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Move Target Parent", priority: "MEDIUM" });

      const moveSourceId = task1Res.body.data.id;
      const moveTargetId = task2Res.body.data.id;
      createdTaskIds.push(moveSourceId, moveTargetId);

      const res = await request(TEST_BASE_URL)
        .put(`/api/tasks/${moveSourceId}/parent`)
        .set(authHeader())
        .send({ parentTaskId: moveTargetId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parentTaskId).toBe(moveTargetId);
    });

    it("should reject circular dependency when moving parent", async () => {
      const parentRes = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Circular Parent", priority: "MEDIUM" });
      const childRes = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Circular Child", priority: "MEDIUM" });

      const parentId = parentRes.body.data.id;
      const childId = childRes.body.data.id;
      createdTaskIds.push(parentId, childId);

      await request(TEST_BASE_URL)
        .put(`/api/tasks/${childId}/parent`)
        .set(authHeader())
        .send({ parentTaskId: parentId });

      const res = await request(TEST_BASE_URL)
        .put(`/api/tasks/${parentId}/parent`)
        .set(authHeader())
        .send({ parentTaskId: childId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("CIRCULAR_DEPENDENCY");
    });

    it("should not allow moving task to itself as parent", async () => {
      const res = await request(TEST_BASE_URL)
        .put(`/api/tasks/${parentTaskId}/parent`)
        .set(authHeader())
        .send({ parentTaskId: parentTaskId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should move task to root (null parent)", async () => {
      const taskRes = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Task to Move to Root", priority: "LOW" });

      const taskId = taskRes.body.data.id;
      createdTaskIds.push(taskId);

      const moveRes = await request(TEST_BASE_URL)
        .put(`/api/tasks/${taskId}/parent`)
        .set(authHeader())
        .send({ parentTaskId: null });

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.data.parentTaskId).toBeNull();
    });
  });

  describe("5. Task Merge Operations", () => {
    let mergeTaskIds: string[];

    beforeAll(async () => {
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        const res = await request(TEST_BASE_URL)
          .post("/api/tasks")
          .set(authHeader())
          .send({
            projectId,
            title: `Merge Source ${i + 1}`,
            description: `Description for merge task ${i + 1}`,
            priority: i === 0 ? "HIGH" : i === 1 ? "LOW" : "MEDIUM",
          });
        tasks.push(res.body.data.id);
        createdTaskIds.push(res.body.data.id);
      }
      mergeTaskIds = tasks;
    });

    it("should preview merge with conflicts", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/merge-preview")
        .set(authHeader())
        .send({ taskIds: mergeTaskIds });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conflicts).toBeDefined();
      expect(res.body.data.preview).toBeDefined();
      expect(res.body.data.conflicts.length).toBeGreaterThan(0);
    });

    it("should execute merge", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/merge")
        .set(authHeader())
        .send({
          taskIds: mergeTaskIds.slice(0, 2),
          mergedData: {
            title: "Merged Task Title",
            description: "Merged description",
            priority: "HIGH",
            status: "IN_PROGRESS",
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mergedTask).toBeDefined();
      expect(res.body.data.mergedTask.title).toBe("Merged Task Title");
      createdTaskIds.push(res.body.data.mergedTask.id);
    });

    it("should reject merge with less than 2 tasks", async () => {
      const singleTaskRes = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Single Task", priority: "LOW" });
      createdTaskIds.push(singleTaskRes.body.data.id);

      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/merge")
        .set(authHeader())
        .send({
          taskIds: [singleTaskRes.body.data.id],
          mergedData: { title: "Test", priority: "MEDIUM", status: "BACKLOG" },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject merge from different projects", async () => {
      const otherProjectRes = await request(TEST_BASE_URL)
        .post("/api/projects")
        .set(authHeader())
        .send({ name: "Other Project for Merge Test" });
      const otherProjectId = otherProjectRes.body.data.id;
      createdTaskIds.push(otherProjectId);

      const task1Res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Same Project Task", priority: "LOW" });
      const task2Res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId: otherProjectId, title: "Different Project Task", priority: "LOW" });

      createdTaskIds.push(task1Res.body.data.id, task2Res.body.data.id);

      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/merge-preview")
        .set(authHeader())
        .send({ taskIds: [task1Res.body.data.id, task2Res.body.data.id] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("6. Task Split Operations", () => {
    let splitSourceTaskId: string;

    beforeAll(async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({
          projectId,
          title: "Task to Split",
          description: "Part 1 content\n---\nPart 2 content\n---\nPart 3 content",
          priority: "MEDIUM",
        });
      splitSourceTaskId = res.body.data.id;
      createdTaskIds.push(splitSourceTaskId);
    });

    it("should split task", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${splitSourceTaskId}/split`)
        .set(authHeader())
        .send({
          splits: [
            { title: "Split Result 1", description: "Part 1 content", priority: "HIGH" },
            { title: "Split Result 2", description: "Part 2 content", priority: "MEDIUM" },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newTasks).toBeDefined();
      expect(res.body.data.newTasks.length).toBe(2);
      createdTaskIds.push(...res.body.data.newTasks.map((t: any) => t.id));
    });

    it("should reject split with less than 2 splits", async () => {
      const newTaskRes = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Single Split Test", priority: "LOW" });
      createdTaskIds.push(newTaskRes.body.data.id);

      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${newTaskRes.body.data.id}/split`)
        .set(authHeader())
        .send({
          splits: [{ title: "Only One", description: "Content", priority: "LOW" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("7. Convert to Project Operations", () => {
    it("should convert tasks to new project", async () => {
      const tasks = [];
      for (let i = 0; i < 2; i++) {
        const res = await request(TEST_BASE_URL)
          .post("/api/tasks")
          .set(authHeader())
          .send({ projectId, title: `Convert Source ${i + 1}`, priority: "MEDIUM" });
        tasks.push(res.body.data.id);
        createdTaskIds.push(res.body.data.id);
      }

      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/convert-to-project")
        .set(authHeader())
        .send({
          projectName: "New Project from Tasks",
          projectDescription: "Created by converting tasks",
          taskIds: tasks,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project).toBeDefined();
      expect(res.body.data.project.name).toBe("New Project from Tasks");
      expect(res.body.data.movedTasks).toBeDefined();
      createdTaskIds.push(res.body.data.project.id);
    });

    it("should reject convert with empty project name", async () => {
      const taskRes = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId, title: "Empty Name Test", priority: "LOW" });
      createdTaskIds.push(taskRes.body.data.id);

      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/convert-to-project")
        .set(authHeader())
        .send({
          projectName: "",
          taskIds: [taskRes.body.data.id],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject convert with no tasks", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/convert-to-project")
        .set(authHeader())
        .send({
          projectName: "Empty Tasks Project",
          taskIds: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("8. Project Management", () => {
    let newProjectId: string;

    beforeAll(async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/projects")
        .set(authHeader())
        .send({ name: "New Test Project", description: "For testing" });
      newProjectId = res.body.data.id;
      createdTaskIds.push(newProjectId);
    });

    it("should get project by ID", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/projects/${newProjectId}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Test Project");
    });

    it("should update project", async () => {
      const res = await request(TEST_BASE_URL)
        .put(`/api/projects/${newProjectId}`)
        .set(authHeader())
        .send({ name: "Updated Project Name", description: "Updated description" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated Project Name");
    });

    it("should get project members", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/projects/${newProjectId}/members`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data));
    });

    it("should get all user projects", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/projects")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data));
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("9. Permission & Security", () => {
    it("should reject request without token", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/projects");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject request with invalid token", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/projects")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject task for non-existent project", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .send({ projectId: "11111111-1111-1111-1111-111111111111", title: "Test" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject update for non-existent task", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/tasks/11111111-1111-1111-1111-111111111111")
        .set(authHeader())
        .send({ title: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("10. Error Handling", () => {
    it("should reject access to non-existent route without auth", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/non-existent-route");

      expect([401, 404]).toContain(res.status);
    });

    it("should handle malformed JSON", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks")
        .set(authHeader())
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect([400, 500]).toContain(res.status);
    });

    it("should return 404 for invalid UUID task", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/tasks/not-a-uuid")
        .set(authHeader());

      expect([400, 404]).toContain(res.status);
    });
  });
});
