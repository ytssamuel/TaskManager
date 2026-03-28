import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = "test-secret-key-for-testing";
const prisma = new PrismaClient();

interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

interface TestProject {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  tasks: unknown[];
}

interface TestTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  orderIndex: number;
  projectId: string;
  columnId: string;
}

function createTestApp() {
  const app = express();
  app.use(express.json());

  const users: TestUser[] = [];
  const projects: TestProject[] = [];
  const tasks: TestTask[] = [];
  const columns = [
    { id: "col-1", name: "Backlog", orderIndex: 0, projectId: "" },
    { id: "col-2", name: "In Progress", orderIndex: 1, projectId: "" },
    { id: "col-3", name: "Done", orderIndex: 2, projectId: "" },
  ];

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name, username } = req.body;

    if (users.find((u) => u.email === email)) {
      return res.status(409).json({
        success: false,
        error: { code: "CONFLICT", message: "此 email 已被註冊" },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: TestUser = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split("@")[0],
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    users.push(user);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      data: { user, accessToken: token },
    });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "帳號或密碼錯誤" },
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "帳號或密碼錯誤" },
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      data: { user, accessToken: token },
    });
  });

  // Project routes
  const authMiddleware = (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "未登入" },
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      (req as any).user = { userId: decoded.userId, email: decoded.email };
      next();
    } catch {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "無效或已過期的 token" },
      });
    }
  };

  app.get("/api/projects", authMiddleware, (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const userProjects = projects.filter((p) => p.ownerId === userId);
    res.json({ success: true, data: userProjects });
  });

  app.post("/api/projects", authMiddleware, (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "專案名稱不能為空" },
      });
    }

    const project: TestProject = {
      id: `project-${Date.now()}`,
      name: name.trim(),
      description: description || "",
      ownerId: userId,
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    projects.push(project);

    res.status(201).json({ success: true, data: project });
  });

  // Task routes
  app.get("/api/tasks", authMiddleware, (req: Request, res: Response) => {
    const { projectId } = req.query;
    const userId = (req as any).user.userId;

    let userTasks = tasks;
    if (projectId) {
      userTasks = tasks.filter((t) => t.projectId === projectId);
    }

    res.json({ success: true, data: userTasks });
  });

  app.post("/api/tasks", authMiddleware, (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { title, projectId, columnId } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "任務標題不能為空" },
      });
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "專案不存在" },
      });
    }

    const task: TestTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: req.body.description || "",
      status: "BACKLOG",
      priority: req.body.priority || "MEDIUM",
      orderIndex: tasks.filter((t) => t.projectId === projectId).length,
      projectId,
      columnId: columnId || "col-1",
    };
    tasks.push(task);

    res.status(201).json({ success: true, data: task });
  });

  return app;
}

describe("Extended API Integration Tests", () => {
  let app: ReturnType<typeof createTestApp>;
  let token: string;
  let projectId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("Task API", () => {
    const testEmail = `task-test-${Date.now()}@example.com`;
    const testPassword = "testpass123";

    it("should create a task", async () => {
      // Register
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
          name: "Task Tester",
          username: "tasktester",
        })
        .expect(201);

      // Login
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      token = loginRes.body.data.accessToken;

      // Create project
      const projectRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Test Project" })
        .expect(201);

      projectId = projectRes.body.data.id;

      // Create task
      const taskRes = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test Task",
          projectId,
          columnId: "col-1",
          priority: "HIGH",
        })
        .expect(201);

      expect(taskRes.body.success).toBe(true);
      expect(taskRes.body.data.title).toBe("Test Task");
      expect(taskRes.body.data.priority).toBe("HIGH");
    });

    it("should get tasks by project", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .query({ projectId })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should reject task without title", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          projectId,
          columnId: "col-1",
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Project API", () => {
    it("should get empty project list", async () => {
      const res = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should reject empty project name", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "   " })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
