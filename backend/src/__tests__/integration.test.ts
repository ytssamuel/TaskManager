import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express, { Request, Response } from "express";

const JWT_SECRET = "test-secret-key-for-testing";

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

function createTestApp() {
  const app = express();
  app.use(express.json());

  const users: TestUser[] = [];
  const projects: TestProject[] = [];

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

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
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken: token,
      },
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
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken: token,
      },
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "未提供認證 token" },
      });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      const user = users.find((u) => u.id === payload.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "用戶不存在" },
        });
      }

      res.json({
        success: true,
        data: { id: user.id, email: user.email, name: user.name },
      });
    } catch {
      res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "無效或已過期的 token" },
      });
    }
  });

  app.get("/api/projects", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "未登入" },
      });
    }

    res.json({ success: true, data: projects });
  });

  app.post("/api/projects", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "未登入" },
      });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: "無效或已過期的 token" },
      });
    }

    const { name, description } = req.body;
    if (!name || name.trim() === "") {
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

  return app;
}

describe("API Integration Tests", () => {
  const app = createTestApp();
  let authToken: string;
  let testUserId: string;

  describe("Auth API", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.accessToken).toBeDefined();

      authToken = response.body.data.accessToken;
      testUserId = response.body.data.user.id;
    });

    it("should reject duplicate email registration", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
          name: "Test User 2",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("CONFLICT");
    });

    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it("should reject login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should get current user with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUserId);
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Project API", () => {
    it("should get empty project list", async () => {
      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it("should create a new project", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Project",
          description: "A test project description",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Test Project");
      expect(response.body.data.id).toBeDefined();
    });

    it("should reject empty project name", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
          description: "Test",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should get project list with created project", async () => {
      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe("Test Project");
    });
  });

  describe("Edge Cases", () => {
    it("should handle duplicate registration gracefully", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "duplicate@example.com",
          password: "password123",
          name: "First",
        });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "duplicate@example.com",
          password: "password456",
          name: "Second",
        });

      expect(response.status).toBe(409);
    });

    it("should reject non-existent user login", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.status).toBe(401);
    });
  });
});
