import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddSubtaskDialog } from "@/components/AddSubtaskDialog";
import type { Task, TaskStatus, Priority } from "@/lib/types";

const { toastMock, taskServiceMock } = vi.hoisted(() => {
  const toastMockFn = vi.fn();

  const taskServiceMockObj = {
    getSubtasks: vi.fn().mockResolvedValue({ subtasks: [], totalCount: 0 }),
    createSubtask: vi.fn().mockResolvedValue({
      id: "new-subtask-id",
      title: "新建的子任務",
      status: "BACKLOG" as TaskStatus,
      priority: "MEDIUM" as Priority,
      orderIndex: 0,
      dependencies: [],
      assignees: [],
      childCount: 0,
      parentTaskId: "parent-task-id",
      createdBy: { id: "user-1", name: "張三" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    mergePreview: vi.fn().mockResolvedValue({}),
    mergeTasks: vi.fn().mockResolvedValue({}),
    splitTask: vi.fn().mockResolvedValue({ newTasks: [], sourceTaskId: "" }),
    convertToProject: vi.fn().mockResolvedValue({ project: { id: "", name: "" }, movedTasks: [] }),
    getProjectTasks: vi.fn().mockResolvedValue({ tasks: [], columns: [] }),
    getTask: vi.fn().mockResolvedValue({}),
    createTask: vi.fn().mockResolvedValue({}),
    updateTask: vi.fn().mockResolvedValue({}),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue({}),
    reorderTask: vi.fn().mockResolvedValue({}),
    addDependency: vi.fn().mockResolvedValue({}),
    removeDependency: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue({ id: "task-id", parentTaskId: null }),
  };

  return {
    toastMock: toastMockFn,
    taskServiceMock: taskServiceMockObj,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: any[]) => toastMock(...args),
  useToast: () => ({
    toast: (...args: any[]) => toastMock(...args),
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

vi.mock("@/services/task", () => ({
  taskService: taskServiceMock,
}));

describe("AddSubtaskDialog", () => {
  const mockParentTask: Task = {
    id: "parent-task-id",
    title: "父任務",
    status: "IN_PROGRESS" as TaskStatus,
    priority: "HIGH" as Priority,
    orderIndex: 0,
    dependencies: [],
    assignees: [],
    childCount: 0,
    createdBy: { id: "user-1", name: "張三" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    parentTask: mockParentTask,
    onSubtaskCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("對話框開關", () => {
    it("open 為 true 時對話框可見", () => {
      render(<AddSubtaskDialog {...defaultProps} />);
      expect(screen.getByText("新增子任務")).toBeInTheDocument();
    });

    it("open 為 false 時對話框不渲染內容", () => {
      render(<AddSubtaskDialog {...defaultProps} open={false} />);
      expect(screen.queryByText("新增子任務")).not.toBeInTheDocument();
    });
  });

  describe("初始顯示", () => {
    it("顯示父任務標題", () => {
      render(<AddSubtaskDialog {...defaultProps} />);
      expect(screen.getByText("父任務", { selector: "div" })).toBeInTheDocument();
    });

    it("標題輸入框為空", () => {
      render(<AddSubtaskDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText("輸入子任務標題...");
      expect(input).toHaveValue("");
    });

    it("優先級預設為 MEDIUM", () => {
      render(<AddSubtaskDialog {...defaultProps} />);
      expect(screen.getByText("中", { selector: "button span" })).toBeInTheDocument();
    });
  });

  describe("表單輸入", () => {
    it("可以輸入標題", () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務標題" } });

      expect(screen.getByDisplayValue("新子任務標題")).toBeInTheDocument();
    });

    it("可以輸入描述", () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("任務描述...");
      fireEvent.change(textarea, { target: { value: "這是子任務的描述" } });

      expect(screen.getByDisplayValue("這是子任務的描述")).toBeInTheDocument();
    });
  });

  describe("表單驗證", () => {
    it("未填寫標題時顯示驗證錯誤", async () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("請輸入任務標題")).toBeInTheDocument();
      });
    });

    it("只填標題不填描述可以提交", async () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(taskServiceMock.createSubtask).toHaveBeenCalledWith("parent-task-id", {
          title: "新子任務",
          description: undefined,
          priority: "MEDIUM",
        });
      });
    });
  });

  describe("取消行為", () => {
    it("點擊取消按鈕呼叫 onOpenChange(false)", () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "取消" });
      fireEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it("取消不清除表單（組件控制）", () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const cancelButton = screen.getByRole("button", { name: "取消" });
      fireEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("提交行為", () => {
    it("提交時呼叫 API", async () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(taskServiceMock.createSubtask).toHaveBeenCalledWith("parent-task-id", {
          title: "新子任務",
          description: undefined,
          priority: "MEDIUM",
        });
      });
    });

    it("提交成功後呼叫 onSubtaskCreated", async () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubtaskCreated).toHaveBeenCalled();
      });
    });

    it("提交成功後關閉對話框", async () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("提交成功後顯示成功 toast", async () => {
      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith({ title: "子任務已建立" });
      });
    });
  });

  describe("錯誤處理", () => {
    it("建立失敗顯示錯誤 toast", async () => {
      taskServiceMock.createSubtask.mockRejectedValue(new Error("建立失敗"));

      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "建立失敗",
            description: "建立失敗",
            variant: "destructive",
          })
        );
      });
    });

    it("建立失敗不關閉對話框", async () => {
      taskServiceMock.createSubtask.mockRejectedValue(new Error("建立失敗"));

      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onOpenChange).not.toHaveBeenCalled();
      });
    });

    it("建立失敗不清除表單", async () => {
      taskServiceMock.createSubtask.mockRejectedValue(new Error("建立失敗"));

      render(<AddSubtaskDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入子任務標題...");
      fireEvent.change(input, { target: { value: "新子任務" } });

      const submitButton = screen.getByRole("button", { name: "建立" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue("新子任務")).toBeInTheDocument();
      });
    });
  });
});
