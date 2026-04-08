import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SplitDialog } from "@/components/SplitDialog";
import type { Task, TaskStatus, Priority } from "@/lib/types";

const { toastMock, taskServiceMock } = vi.hoisted(() => {
  const toastMockFn = vi.fn();

  const taskServiceMockObj = {
    getSubtasks: vi.fn().mockResolvedValue({ subtasks: [], totalCount: 0 }),
    createSubtask: vi.fn().mockResolvedValue({}),
    mergePreview: vi.fn().mockResolvedValue({}),
    mergeTasks: vi.fn().mockResolvedValue({}),
    splitTask: vi.fn().mockResolvedValue({
      newTasks: [
        {
          id: "split-task-1",
          title: "拆分任務 1",
          status: "BACKLOG" as TaskStatus,
          priority: "MEDIUM" as Priority,
          orderIndex: 0,
          dependencies: [],
          assignees: [],
          childCount: 0,
          createdBy: { id: "user-1", name: "張三" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "split-task-2",
          title: "拆分任務 2",
          status: "BACKLOG" as TaskStatus,
          priority: "MEDIUM" as Priority,
          orderIndex: 1,
          dependencies: [],
          assignees: [],
          childCount: 0,
          createdBy: { id: "user-1", name: "張三" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      sourceTaskId: "original-task-id",
    }),
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

describe("SplitDialog", () => {
  const mockTask: Task = {
    id: "task-1",
    title: "原始任務",
    description: "這是原始任務的描述",
    status: "BACKLOG" as TaskStatus,
    priority: "HIGH" as Priority,
    orderIndex: 0,
    dependencies: [],
    assignees: [],
    childCount: 2,
    createdBy: { id: "user-1", name: "張三" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    task: mockTask,
    onSplitComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("對話框開關", () => {
    it("open 為 true 時對話框可見", () => {
      render(<SplitDialog {...defaultProps} />);
      expect(screen.getByText("拆分任務")).toBeInTheDocument();
    });

    it("open 為 false 時對話框不渲染內容", () => {
      render(<SplitDialog {...defaultProps} open={false} />);
      expect(screen.queryByText("拆分任務")).not.toBeInTheDocument();
    });
  });

  describe("初始顯示", () => {
    it("顯示原任務標題", () => {
      render(<SplitDialog {...defaultProps} />);
      expect(screen.getByText("原始任務")).toBeInTheDocument();
    });

    it("顯示原任務描述", () => {
      render(<SplitDialog {...defaultProps} />);
      expect(screen.getByText("這是原始任務的描述")).toBeInTheDocument();
    });

    it("預設顯示 2 個拆分預覽", () => {
      render(<SplitDialog {...defaultProps} />);
      expect(screen.getByText("預覽分割結果 (2 個任務)")).toBeInTheDocument();
    });
  });

  describe("新增拆分", () => {
    it("點擊新增按鈕增加一個拆分", async () => {
      render(<SplitDialog {...defaultProps} />);

      const addButton = screen.getByRole("button", { name: "新增一個任務" });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("預覽分割結果 (3 個任務)")).toBeInTheDocument();
      });
    });
  });

  describe("警告訊息", () => {
    it("顯示子任務刪除警告", () => {
      render(<SplitDialog {...defaultProps} />);
      expect(screen.getByText("原任務的子任務將被刪除")).toBeInTheDocument();
    });

    it("顯示依賴轉移警告", () => {
      render(<SplitDialog {...defaultProps} />);
      expect(screen.getByText("依賴關係將轉移到第一個新任務")).toBeInTheDocument();
    });

    it("顯示留言轉移警告", () => {
      render(<SplitDialog {...defaultProps} />);
      expect(screen.getByText("留言將移到第一個新任務")).toBeInTheDocument();
    });
  });

  describe("取消行為", () => {
    it("點擊取消按鈕呼叫 onOpenChange(false)", () => {
      render(<SplitDialog {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "取消" });
      fireEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("驗證行為", () => {
    it("拆分任務標題和描述都為空時顯示錯誤", async () => {
      render(<SplitDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: "確認拆分" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "至少需要 2 個有效的拆分任務",
            variant: "destructive",
          })
        );
      });
    });
  });

  describe("錯誤處理", () => {
    it("API 呼叫失敗時顯示錯誤 toast", async () => {
      taskServiceMock.splitTask.mockRejectedValue(new Error("API 錯誤"));

      render(<SplitDialog {...defaultProps} />);

      const descTextarea = screen.getByPlaceholderText(/第一部分內容/);
      fireEvent.change(descTextarea, { target: { value: "第一部分內容\n---\n第二部分內容" } });

      await waitFor(() => {
        expect(screen.getByText("預覽分割結果 (2 個任務)")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: "確認拆分" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "拆分失敗",
            variant: "destructive",
          })
        );
      });
    });
  });
});
