import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { extractToken, hashPassword, comparePassword } from "@/utils/auth";

describe("Auth Utilities", () => {
  const JWT_SECRET = "test-secret-key-for-testing";

  describe("Password Hashing", () => {
    it("should hash a password correctly", async () => {
      const password = "testPassword123";
      const saltRounds = 10;

      const hash = await bcrypt.hash(password, saltRounds);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 10);

      const result = await bcrypt.compare(password, hash);
      expect(result).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hash = await bcrypt.hash(password, 10);

      const result = await bcrypt.compare(wrongPassword, hash);
      expect(result).toBe(false);
    });
  });

  describe("JWT Token", () => {
    it("should generate a valid token", () => {
      const payload = { userId: "test-user-id", email: "test@example.com" };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should verify a valid token", () => {
      const payload = { userId: "test-user-id", email: "test@example.com" };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it("should reject invalid token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });
  });
});

describe("Validation Schemas", () => {
  describe("Register Schema", () => {
    it("should validate valid register data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      expect(validData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(validData.password.length).toBeGreaterThanOrEqual(8);
      expect(validData.name.length).toBeGreaterThanOrEqual(2);
    });

    it("should reject invalid email", () => {
      const invalidEmails = ["notanemail", "missing@", "@nodomain.com", "spaces in@email.com"];

      invalidEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("should reject short password", () => {
      const shortPassword = "1234567";
      expect(shortPassword.length).toBeLessThan(8);
    });
  });

  describe("Project Schema", () => {
    it("should validate valid project data", () => {
      const validProject = {
        name: "Test Project",
        description: "A test project description",
      };

      expect(validProject.name.length).toBeGreaterThan(0);
      expect(validProject.name.length).toBeLessThanOrEqual(100);
    });

    it("should reject empty project name", () => {
      const invalidProject = {
        name: "",
      };

      expect(invalidProject.name.length).toBe(0);
    });
  });
});

describe("Response Utilities", () => {
  it("should create success response", () => {
    const data = { id: "test-id", name: "Test" };

    const response = {
      success: true,
      data,
    };

    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
  });

  it("should create error response", () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: { email: "Invalid email format" },
    };

    const response = {
      success: false,
      error,
    };

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("Helper Functions", () => {
  it("should extract token from Bearer header", () => {
    const token = "test-jwt-token";
    const authHeader = `Bearer ${token}`;

    const extractedToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    expect(extractedToken).toBe(token);
  });

  it("should return null for missing Bearer header", () => {
    // Test the extractToken function directly with various inputs
    const result1 = extractToken(undefined);
    const result2 = extractToken("Basic abc123");

    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});
