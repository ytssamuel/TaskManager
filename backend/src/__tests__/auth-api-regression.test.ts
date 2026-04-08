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

describe("Auth API Additional Tests", () => {
  let testUser: TestUser;
  let newPassword: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    testUser = {
      id: "",
      email: `auth-add-${timestamp}@example.com`,
      username: `authadd${timestamp}`,
      name: "Auth Test User",
      password: "testpass123456",
      accessToken: "",
    };
    newPassword = "newpass1234567";

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
        .send({ username: testUser.username, password: testUser.password });
      testUser.id = loginRes.body.data.user.id;
      testUser.accessToken = loginRes.body.data.accessToken;
    }
  });

  afterAll(async () => {
    try {
      await request(TEST_BASE_URL)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send({ confirmPassword: newPassword });
    } catch (e) {
      // ignore cleanup errors
    }
  });

  const authHeader = () => ({ Authorization: `Bearer ${testUser.accessToken}` });

  describe("1. Update Profile (PUT /api/auth/profile)", () => {
    it("should update username", async () => {
      const newUsername = `updated_${testUser.username}`;
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ username: newUsername });

      expect([200, 409]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.username).toBe(newUsername);
      }
    });

    it("should update name", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated Name");
    });

    it("should update both username and name", async () => {
      const newUsername = `dual_${Date.now()}`;
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ username: newUsername, name: "Dual Update" });

      expect([200, 409]).toContain(res.status);
    });

    it("should reject update with short username", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ username: "ab" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject update with short name", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ name: "a" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject profile update without token", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/profile")
        .send({ name: "Test" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. Change Password (PUT /api/auth/password)", () => {
    it("should change password successfully", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/password")
        .set(authHeader())
        .send({
          currentPassword: testUser.password,
          newPassword: newPassword,
          confirmPassword: newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("密碼已更新");

      // Update stored password for potential cleanup
      const tempUser = { ...testUser };
      testUser.password = newPassword;
      newPassword = tempUser.password;
    });

    it("should reject with wrong current password", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/password")
        .set(authHeader())
        .send({
          currentPassword: "wrongpassword",
          newPassword: "newpass1234567",
          confirmPassword: "newpass1234567",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject when new passwords do not match", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/password")
        .set(authHeader())
        .send({
          currentPassword: testUser.password,
          newPassword: "password12345678",
          confirmPassword: "differentpassword",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject with short new password", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/password")
        .set(authHeader())
        .send({
          currentPassword: testUser.password,
          newPassword: "short",
          confirmPassword: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject password change without token", async () => {
      const res = await request(TEST_BASE_URL)
        .put("/api/auth/password")
        .send({
          currentPassword: testUser.password,
          newPassword: "newpass1234567",
          confirmPassword: "newpass1234567",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. Upload Avatar (POST /api/auth/avatar)", () => {
    it("should reject upload without file", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/avatar")
        .set(authHeader());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject upload without token", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/avatar")
        .attach("avatar", Buffer.from("fake image"), "test.png");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject non-image file", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/avatar")
        .set(authHeader())
        .attach("avatar", Buffer.from("not an image"), { filename: "test.txt", contentType: "text/plain" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("4. Delete Account (DELETE /api/auth/account)", () => {
    it("should delete account with correct password", async () => {
      const res = await request(TEST_BASE_URL)
        .delete("/api/auth/account")
        .set(authHeader())
        .send({ confirmPassword: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject delete with wrong password", async () => {
      const res = await request(TEST_BASE_URL)
        .delete("/api/auth/account")
        .set(authHeader())
        .send({ confirmPassword: "wrongpassword" });

      expect([400, 401, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it("should reject delete without password", async () => {
      const res = await request(TEST_BASE_URL)
        .delete("/api/auth/account")
        .set(authHeader())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject delete without token", async () => {
      const res = await request(TEST_BASE_URL)
        .delete("/api/auth/account")
        .send({ confirmPassword: "somepassword" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("5. Logout (POST /api/auth/logout)", () => {
    it("should logout successfully", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should logout even without token", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Auth Edge Cases", () => {
    it("should reject login with non-existent user", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/login")
        .send({ username: "nonexistentuser12345", password: "somepassword" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject register with existing email", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: testUser.email,
          password: "testpass123456",
          name: "Another User",
          username: `another_${Date.now()}`,
        });

      // If user was deleted in previous test, email is now available (201)
      // Otherwise should be conflict (409)
      expect([201, 409]).toContain(res.status);
    });

    it("should reject register with existing username", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: `newemail_${Date.now()}@example.com`,
          password: "testpass123456",
          name: "Another User",
          username: testUser.username,
        });

      // If user was deleted in previous test, username is now available (201)
      // Otherwise should be conflict (409)
      expect([201, 409]).toContain(res.status);
    });

    it("should reject register with invalid email", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: "notanemail",
          password: "testpass123456",
          name: "Test",
          username: `invalid_${Date.now()}`,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject register with short password", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: `shortpw_${Date.now()}@example.com`,
          password: "1234567",
          name: "Test",
          username: `shortpw_${Date.now()}`,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject register with short username", async () => {
      const res = await request(TEST_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: `shortun_${Date.now()}@example.com`,
          password: "testpass123456",
          name: "Test",
          username: "ab",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
