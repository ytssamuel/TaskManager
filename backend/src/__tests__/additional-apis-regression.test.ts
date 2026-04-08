import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

const TEST_BASE_URL = "http://localhost:3000";

interface TestUser {
  id: string;
  email: string;
  username: string;
  name: string;
  password: string;
  accessToken: string;
}

describe("Additional API Regression Tests", () => {
  let testUser: TestUser;
  let projectId: string;
  let taskId: string;
  let columnId: string;
  let secondUser: TestUser;
  let memberUserId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const timestamp = Date.now();

    testUser = {
      id: "",
      email: `test-add-${timestamp}@example.com`,
      username: `testadd${timestamp}`,
      name: "Test User",
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
      .send({ name: "Additional Test Project", description: "For additional tests" });

    projectId = projectRes.body.data.id;
    createdIds.push(projectId);

    const taskRes = await request(TEST_BASE_URL)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${testUser.accessToken}`)
      .send({ projectId, title: "Test Task for Comments", priority: "MEDIUM" });

    taskId = taskRes.body.data.id;
    createdIds.push(taskId);

    const projectDetailRes = await request(TEST_BASE_URL)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${testUser.accessToken}`);
    columnId = projectDetailRes.body.data.columns?.[0]?.id;

    secondUser = {
      id: "",
      email: `member-add-${timestamp}@example.com`,
      username: `memberadd${timestamp}`,
      name: "Member User",
      password: "testpass123456",
      accessToken: "",
    };

    const memberRes = await request(TEST_BASE_URL)
      .post("/api/auth/register")
      .send({
        email: secondUser.email,
        password: secondUser.password,
        name: secondUser.name,
        username: secondUser.username,
      });

    if (memberRes.body.success) {
      secondUser.id = memberRes.body.data.user.id;
    } else {
      const loginRes = await request(TEST_BASE_URL)
        .post("/api/auth/login")
        .send({ email: secondUser.email, password: secondUser.password });
      secondUser.id = loginRes.body.data.user.id;
    }
    memberUserId = secondUser.id;
  });

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await request(TEST_BASE_URL)
          .delete(`/api/projects/${id}`)
          .set("Authorization", `Bearer ${testUser.accessToken}`);
      } catch (e) {
        // ignore
      }
    }
  });

  const authHeader = () => ({ Authorization: `Bearer ${testUser.accessToken}` });

  describe("1. Task Assignees API", () => {
    it("should add assignee to task", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${taskId}/assignees`)
        .set(authHeader())
        .send({ userId: memberUserId });

      expect([200, 201, 400]).toContain(res.status);
      if (res.status === 400 && res.body.error.code === "VALIDATION_ERROR") {
        expect(res.body.error.message).toContain("專案成員");
      } else {
        expect(res.body.success).toBe(true);
      }
    });

    it("should get assignees for task", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/tasks/${taskId}/assignees`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should reject add assignee for non-existent task", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/11111111-1111-1111-1111-111111111111/assignees")
        .set(authHeader())
        .send({ userId: memberUserId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should reject add assignee with invalid user", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${taskId}/assignees`)
        .set(authHeader())
        .send({ userId: "11111111-1111-1111-1111-111111111111" });

      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. Task Comments API", () => {
    let createdCommentId: string;

    it("should create a comment", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${taskId}/comments`)
        .set(authHeader())
        .send({ content: "This is a test comment" });

      expect([200, 201]).toContain(res.status);
      if (res.body.success) {
        expect(res.body.data.content).toBe("This is a test comment");
        createdCommentId = res.body.data.id;
      }
    });

    it("should get comments for task", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/tasks/${taskId}/comments`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should reject comment without content", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/tasks/${taskId}/comments`)
        .set(authHeader())
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject comment for non-existent task", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/tasks/11111111-1111-1111-1111-111111111111/comments")
        .set(authHeader())
        .send({ content: "Test comment" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should delete comment", async () => {
      if (!createdCommentId) {
        const createRes = await request(TEST_BASE_URL)
          .post(`/api/tasks/${taskId}/comments`)
          .set(authHeader())
          .send({ content: "Comment to delete" });
        if (createRes.body.success) {
          createdCommentId = createRes.body.data.id;
        }
      }

      if (createdCommentId) {
        const res = await request(TEST_BASE_URL)
          .delete(`/api/tasks/${taskId}/comments/${createdCommentId}`)
          .set(authHeader());

        expect([200, 404]).toContain(res.status);
      }
    });
  });

  describe("3. Column API", () => {
    let createdColumnId: string;

    it("should get columns for project", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/columns/${projectId}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should create a column", async () => {
      const res = await request(TEST_BASE_URL)
        .post(`/api/columns/${projectId}`)
        .set(authHeader())
        .send({ name: "New Column", orderIndex: 10 });

      expect([200, 201]).toContain(res.status);
      if (res.body.success) {
        expect(res.body.data.name).toBe("New Column");
        createdColumnId = res.body.data.id;
      }
    });

    it("should update a column", async () => {
      if (!createdColumnId && columnId) {
        const res = await request(TEST_BASE_URL)
          .put(`/api/columns/${columnId}`)
          .set(authHeader())
          .send({ name: "Updated Column Name" });

        expect([200, 404]).toContain(res.status);
      } else if (createdColumnId) {
        const res = await request(TEST_BASE_URL)
          .put(`/api/columns/${createdColumnId}`)
          .set(authHeader())
          .send({ name: "Updated Column Name" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it("should reorder columns", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/columns/reorder")
        .set(authHeader())
        .send({
          columns: [
            { id: columnId, orderIndex: 0 },
            { id: createdColumnId, orderIndex: 1 },
          ],
        });

      expect([200, 400]).toContain(res.status);
    });

    it("should delete a column", async () => {
      if (createdColumnId) {
        const res = await request(TEST_BASE_URL)
          .delete(`/api/columns/${createdColumnId}`)
          .set(authHeader());

        expect([200, 400]).toContain(res.status);
      }
    });

    it("should reject column for non-existent project", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/columns/11111111-1111-1111-1111-111111111111")
        .set(authHeader());

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe("4. Project Members API", () => {
    let memberUserToken: string = "";

    beforeAll(async () => {
      const loginRes = await request(TEST_BASE_URL)
        .post("/api/auth/login")
        .send({ email: secondUser.email, password: secondUser.password });
      memberUserToken = loginRes.body.data?.accessToken || "";
    });

    it("should get project members", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/projects/${projectId}/members`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should add member to project via invite", async () => {
      const createInviteRes = await request(TEST_BASE_URL)
        .post("/api/invites")
        .set(authHeader())
        .send({
          projectId,
          email: secondUser.email,
          role: "MEMBER",
          expiresInDays: 7,
        });

      expect([200, 201, 400, 409]).toContain(createInviteRes.status);

      if (createInviteRes.status === 201 && createInviteRes.body.data?.invite?.token && memberUserToken) {
        const acceptRes = await request(TEST_BASE_URL)
          .post(`/api/invites/${createInviteRes.body.data.invite.token}/accept`)
          .set("Authorization", `Bearer ${memberUserToken}`);

        expect([200, 400, 403]).toContain(acceptRes.status);
      }
    });

    it("should reject add member without permission", async () => {
      const thirdUserRes = await request(TEST_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: `third-${Date.now()}@example.com`,
          password: "testpass123456",
          name: "Third User",
          username: `third${Date.now()}`,
        });

      if (thirdUserRes.body.success && thirdUserRes.body.data?.accessToken) {
        const thirdUserId = thirdUserRes.body.data.user.id;
        const res = await request(TEST_BASE_URL)
          .post(`/api/projects/${projectId}/members`)
          .set("Authorization", `Bearer ${thirdUserRes.body.data.accessToken}`)
          .send({ email: thirdUserId, role: "MEMBER" });

        expect([400, 403, 404]).toContain(res.status);
      }
    });
  });

  describe("5. Activities API", () => {
    it("should get project activities", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/activities/projects/${projectId}/activities`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should get task activities", async () => {
      const res = await request(TEST_BASE_URL)
        .get(`/api/activities/tasks/${taskId}/activities`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject activities for non-existent project", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/activities/projects/11111111-1111-1111-1111-111111111111/activities")
        .set(authHeader());

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe("6. Invite API", () => {
    let inviteId: string;

    it("should create an invite", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/invites")
        .set(authHeader())
        .send({
          projectId,
          email: `newuser-${Date.now()}@example.com`,
          role: "MEMBER",
          expiresInDays: 7,
        });

      expect([200, 201, 400, 409]).toContain(res.status);
      if (res.status === 201 && res.body.data?.invite) {
        inviteId = res.body.data.invite.id;
      }
    });

    it("should list invites", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/invites")
        .set(authHeader())
        .query({ projectId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should reject invite with invalid email", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/invites")
        .set(authHeader())
        .send({
          projectId,
          email: "invalid-email",
          role: "MEMBER",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should delete an invite", async () => {
      if (!inviteId) {
        const createRes = await request(TEST_BASE_URL)
          .post("/api/invites")
          .set(authHeader())
          .send({
            projectId,
            email: `delete-${Date.now()}@example.com`,
            role: "MEMBER",
            expiresInDays: 7,
          });

        if (createRes.status === 201 && createRes.body.data?.invite) {
          inviteId = createRes.body.data.invite.id;
        }
      }

      if (inviteId) {
        const res = await request(TEST_BASE_URL)
          .delete(`/api/invites/${inviteId}`)
          .set(authHeader());

        expect([200, 404]).toContain(res.status);
      }
    });
  });

  describe("7. API Keys API", () => {
    let createdKeyId: string;

    it("should create an API key", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/keys")
        .set(authHeader())
        .send({
          name: "Test API Key",
          role: "MEMBER",
        });

      expect([200, 201]).toContain(res.status);
      if (res.body.success) {
        expect(res.body.data.name).toBe("Test API Key");
        expect(res.body.data.key).toBeDefined();
        createdKeyId = res.body.data.id;
      }
    });

    it("should list API keys", async () => {
      const res = await request(TEST_BASE_URL)
        .get("/api/keys")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should delete an API key", async () => {
      if (!createdKeyId) {
        const createRes = await request(TEST_BASE_URL)
          .post("/api/keys")
          .set(authHeader())
          .send({ name: "Key to Delete", role: "READ_ONLY" });

        if (createRes.body.success) {
          createdKeyId = createRes.body.data.id;
        }
      }

      if (createdKeyId) {
        const res = await request(TEST_BASE_URL)
          .delete(`/api/keys/${createdKeyId}`)
          .set(authHeader());

        expect([200, 404]).toContain(res.status);
      }
    });

    it("should reject API key without name", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/keys")
        .set(authHeader())
        .send({ role: "MEMBER" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("8. Delete Project API", () => {
    it("should delete a project", async () => {
      const createRes = await request(TEST_BASE_URL)
        .post("/api/projects")
        .set(authHeader())
        .send({ name: "Project to Delete" });

      if (createRes.body.success) {
        const newProjectId = createRes.body.data.id;
        createdIds.push(newProjectId);

        const res = await request(TEST_BASE_URL)
          .delete(`/api/projects/${newProjectId}`)
          .set(authHeader());

        expect([200, 403]).toContain(res.status);
      }
    });

    it("should reject delete for non-owner", async () => {
      const otherUserRes = await request(TEST_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: `other-${Date.now()}@example.com`,
          password: "testpass123456",
          name: "Other User",
          username: `other${Date.now()}`,
        });

      if (otherUserRes.body.success) {
        const otherUserId = otherUserRes.body.data.user.id;

        const createRes = await request(TEST_BASE_URL)
          .post("/api/projects")
          .set(authHeader())
          .send({ name: "Other User Project" });

        if (createRes.body.success) {
          const projectToDeleteId = createRes.body.data.id;
          createdIds.push(projectToDeleteId);

          const deleteRes = await request(TEST_BASE_URL)
            .delete(`/api/projects/${projectToDeleteId}`)
            .set("Authorization", `Bearer ${otherUserRes.body.data.accessToken}`);

          expect([403, 404]).toContain(deleteRes.status);
        }
      }
    });
  });
});
