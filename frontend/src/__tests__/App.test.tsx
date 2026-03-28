import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Login Page", () => {
  it("renders login form elements", () => {
    renderWithRouter(<Login />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("has a register link", () => {
    renderWithRouter(<Login />);
    const registerLink = screen.getByText(/register/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
  });
});

describe("Register Page", () => {
  it("renders register form elements", () => {
    renderWithRouter(<Register />);
    // Use getByPlaceholderText for more reliable matching
    expect(screen.getByPlaceholderText("3-50 字元")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("顯示名稱")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("至少 8 個字元")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("has a login link", () => {
    renderWithRouter(<Register />);
    const loginLink = screen.getByText(/login/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });
});

describe("Dashboard Page", () => {
  it("shows dashboard title", () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByText("儀表板")).toBeInTheDocument();
  });
});

describe("Utility Functions", () => {
  it("formats initials correctly", () => {
    const getInitials = (name: string) =>
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("John")).toBe("J");
    expect(getInitials("")).toBe("");
    expect(getInitials("張三")).toBe("張");
  });

  it("validates email format", () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
  });

  it("validates password strength", () => {
    const isValidPassword = (password: string) => password.length >= 8;

    expect(isValidPassword("password123")).toBe(true);
    expect(isValidPassword("short")).toBe(false);
    expect(isValidPassword("")).toBe(false);
  });

  it("formats date correctly", () => {
    const formatDate = (date: string | Date) => {
      return new Intl.DateTimeFormat("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(date));
    };

    const result = formatDate("2024-01-15");
    expect(result).toContain("1");
    expect(result).toContain("15");
  });

  it("generates priority colors", () => {
    const getPriorityColor = (priority: string) => {
      const colors: Record<string, string> = {
        LOW: "bg-gray-100 text-gray-800",
        MEDIUM: "bg-blue-100 text-blue-800",
        HIGH: "bg-orange-100 text-orange-800",
        URGENT: "bg-red-100 text-red-800",
      };
      return colors[priority] || colors.MEDIUM;
    };

    expect(getPriorityColor("LOW")).toBe("bg-gray-100 text-gray-800");
    expect(getPriorityColor("MEDIUM")).toBe("bg-blue-100 text-blue-800");
    expect(getPriorityColor("HIGH")).toBe("bg-orange-100 text-orange-800");
    expect(getPriorityColor("URGENT")).toBe("bg-red-100 text-red-800");
    expect(getPriorityColor("UNKNOWN")).toBe("bg-blue-100 text-blue-800");
  });

  it("generates status colors", () => {
    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        BACKLOG: "bg-gray-100 text-gray-800",
        READY: "bg-blue-100 text-blue-800",
        IN_PROGRESS: "bg-yellow-100 text-yellow-800",
        REVIEW: "bg-purple-100 text-purple-800",
        DONE: "bg-green-100 text-green-800",
      };
      return colors[status] || colors.BACKLOG;
    };

    expect(getStatusColor("BACKLOG")).toBe("bg-gray-100 text-gray-800");
    expect(getStatusColor("READY")).toBe("bg-blue-100 text-blue-800");
    expect(getStatusColor("IN_PROGRESS")).toBe("bg-yellow-100 text-yellow-800");
    expect(getStatusColor("REVIEW")).toBe("bg-purple-100 text-purple-800");
    expect(getStatusColor("DONE")).toBe("bg-green-100 text-green-800");
  });

  it("gets status labels", () => {
    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        BACKLOG: "待整理",
        READY: "準備開始",
        IN_PROGRESS: "進行中",
        REVIEW: "待審核",
        DONE: "已完成",
      };
      return labels[status] || status;
    };

    expect(getStatusLabel("BACKLOG")).toBe("待整理");
    expect(getStatusLabel("READY")).toBe("準備開始");
    expect(getStatusLabel("IN_PROGRESS")).toBe("進行中");
    expect(getStatusLabel("REVIEW")).toBe("待審核");
    expect(getStatusLabel("DONE")).toBe("已完成");
  });

  it("gets priority labels", () => {
    const getPriorityLabel = (priority: string) => {
      const labels: Record<string, string> = {
        LOW: "低",
        MEDIUM: "中",
        HIGH: "高",
        URGENT: "緊急",
      };
      return labels[priority] || priority;
    };

    expect(getPriorityLabel("LOW")).toBe("低");
    expect(getPriorityLabel("MEDIUM")).toBe("中");
    expect(getPriorityLabel("HIGH")).toBe("高");
    expect(getPriorityLabel("URGENT")).toBe("緊急");
  });
});
