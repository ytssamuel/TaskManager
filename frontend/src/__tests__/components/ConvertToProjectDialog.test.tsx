import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConvertToProjectDialog } from "@/components/ConvertToProjectDialog";
import type { Task, TaskStatus, Priority } from "@/lib/types";
import { MemoryRouter } from "react-router-dom";

const { toastMock, taskServiceMock } = vi.hoisted(() => {
  const toastMockFn = vi.fn();

  const taskServiceMockObj = {
    getSubtasks: vi.fn().mockResolvedValue({ subtasks: [], totalCount: 0 }),
    createSubtask: vi.fn().mockResolvedValue({}),
    mergePreview: vi.fn().mockResolvedValue({}),
    mergeTasks: vi.fn().mockResolvedValue({}),
    splitTask: vi.fn().mockResolvedValue({ newTasks: [], sourceTaskId: "" }),
    convertToProject: vi.fn().mockResolvedValue({
      project: { id: "new-project-id", name: "新專案名稱" },
      movedTasks: [{ id: "task-1", projectId: "new-project-id" }],
    }),
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

describe("ConvertToProjectDialog", () => {
  const mockTasks: Task[] = [
    {
      id: "task-1",
      title: "任務 1",
      status: "BACKLOG" as TaskStatus,
      priority: "HIGH" as Priority,
      orderIndex: 0,
      dependencies: [],
      assignees: [],
      childCount: 0,
      createdBy: { id: "user-1", name: "張三" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-2",
      title: "任務 2",
      status: "IN_PROGRESS" as TaskStatus,
      priority: "MEDIUM" as Priority,
      orderIndex: 1,
      dependencies: [],
      assignees: [],
      childCount: 2,
      createdBy: { id: "user-2", name: "李四" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    selectedTasks: mockTasks,
    onConvertComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe("對話框開關", () => {
    it("open 為 true 時對話框可見", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("將任務轉為專案")).toBeInTheDocument();
    });

    it("open 爲 false 時對話框不渲染內容", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} open={false} />);
      expect(screen.queryByText("將任務轉為專案")).not.toBeInTheDocument();
    });
  });

  describe("任務列表顯示", () => {
    it("顯示已選擇的任務數量", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("已選擇 2 個任務")).toBeInTheDocument();
    });

    it("顯示每個任務的標題", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("任務 1")).toBeInTheDocument();
      expect(screen.getByText("任務 2")).toBeInTheDocument();
    });

    it("顯示包含子任務的任務", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("任務 2")).toBeInTheDocument();
      expect(screen.getByText("(含 2 個子任務)")).toBeInTheDocument();
    });

    it("計算並顯示總任務數量", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("共 4 個任務（含子任務）將被轉移")).toBeInTheDocument();
    });
  });

  describe("表單輸入", () => {
    it("可以輸入專案名稱", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入新專案名稱...");
      fireEvent.change(input, { target: { value: "新專案測試" } });

      expect(screen.getByDisplayValue("新專案測試")).toBeInTheDocument();
    });

    it("可以輸入專案描述", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("輸入專案描述...");
      fireEvent.change(textarea, { target: { value: "這是新專案的描述" } });

      expect(screen.getByDisplayValue("這是新專案的描述")).toBeInTheDocument();
    });
  });

  describe("表單驗證", () => {
    it("未填寫專案名稱時顯示驗證錯誤", async () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: "建立專案並轉移" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("請輸入專案名稱")).toBeInTheDocument();
      });
    });
  });

  describe("警告訊息", () => {
    it("顯示任務轉移警告", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("任務將從原專案移到新專案")).toBeInTheDocument();
    });

    it("顯示子任務轉移警告", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("子任務將隨父任務一起轉移")).toBeInTheDocument();
    });

    it("顯示成員不轉移警告", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("原專案的成員不會自動加入新專案")).toBeInTheDocument();
    });

    it("顯示依賴警告", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);
      expect(screen.getByText("跨專案依賴將被標記為外部依賴")).toBeInTheDocument();
    });
  });

  describe("取消行為", () => {
    it("點擊取消按鈕呼叫 onOpenChange(false)", () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "取消" });
      fireEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("提交行為", () => {
    it("填寫名稱後可以提交", async () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入新專案名稱...");
      fireEvent.change(input, { target: { value: "新專案測試" } });

      const submitButton = screen.getByRole("button", { name: "建立專案並轉移" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(taskServiceMock.convertToProject).toHaveBeenCalledWith({
          projectName: "新專案測試",
          projectDescription: undefined,
          taskIds: ["task-1", "task-2"],
        });
      });
    });

    it("提交成功後呼叫 onConvertComplete", async () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入新專案名稱...");
      fireEvent.change(input, { target: { value: "新專案測試" } });

      const submitButton = screen.getByRole("button", { name: "建立專案並轉移" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onConvertComplete).toHaveBeenCalled();
      });
    });

    it("提交成功後關閉對話框", async () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入新專案名稱...");
      fireEvent.change(input, { target: { value: "新專案測試" } });

      const submitButton = screen.getByRole("button", { name: "建立專案並轉移" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("提交成功後顯示成功 toast 並導航", async () => {
      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入新專案名稱...");
      fireEvent.change(input, { target: { value: "新專案測試" } });

      const submitButton = screen.getByRole("button", { name: "建立專案並轉移" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith({
          title: "已建立新專案",
          description: "「新專案名稱」已建立",
        });
      });
    });
  });

  describe("錯誤處理", () => {
    it("轉換失敗顯示錯誤 toast", async () => {
      taskServiceMock.convertToProject.mockRejectedValue(new Error("轉換失敗"));

      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入新專案名稱...");
      fireEvent.change(input, { target: { value: "新專案測試" } });

      const submitButton = screen.getByRole("button", { name: "建立專案並轉移" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "轉換失敗",
            description: "轉換失敗",
            variant: "destructive",
          })
        );
      });
    });

    it("轉換失敗不關閉對話框", async () => {
      taskServiceMock.convertToProject.mockRejectedValue(new Error("轉換失敗"));

      renderWithRouter(<ConvertToProjectDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText("輸入新專案名稱...");
      fireEvent.change(input, { target: { value: "新專案測試" } });

      const submitButton = screen.getByRole("button", { name: "建立專案並轉移" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onOpenChange).not.toHaveBeenCalled();
      });
    });
  });
});
