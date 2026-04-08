import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => {
      if (key === "token") return "test-token";
      if (key === "auth-storage") return JSON.stringify({
        state: { user: { id: "test-id", email: "test@example.com", name: "Test User" }, token: "test-token", isAuthenticated: true },
        version: 0,
      });
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

console.error = vi.fn();
console.warn = vi.fn();
