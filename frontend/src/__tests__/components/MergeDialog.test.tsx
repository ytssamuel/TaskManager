import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MergeDialog } from "@/components/MergeDialog";
import type { Task, TaskStatus, Priority, MergePreview } from "@/lib/types";

const { toastMock, taskServiceMock, mockMergePreview } = vi.hoisted(() => {
  const mockMergePreviewData: MergePreview = {
    conflicts: [
      {
        field: "priority",
        values: [
          { taskId: "task-1", value: "HIGH" },
          { taskId: "task-2", value: "LOW" },
        ],
        suggestedValue: "HIGH",
      },
      {
        field: "status",
        values: [
          { taskId: "task-1", value: "BACKLOG" },
          { taskId: "task-2", value: "IN_PROGRESS" },
        ],
        suggestedValue: "IN_PROGRESS",
      },
    ],
    preview: {
      title: "合併後的任務",
      description: "合併後的描述",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: undefined,
      assignees: [
        { id: "user-1", name: "張三", avatarUrl: undefined },
        { id: "user-2", name: "李四", avatarUrl: undefined },
      ],
      dependencies: [],
    },
  };

  const toastMockFn = vi.fn();

  const taskServiceMockObj = {
    getSubtasks: vi.fn().mockResolvedValue({ subtasks: [], totalCount: 0 }),
    createSubtask: vi.fn().mockResolvedValue({}),
    mergePreview: vi.fn().mockResolvedValue(mockMergePreviewData),
    mergeTasks: vi.fn().mockResolvedValue({
      mergedTask: {
        id: "merged-task-id",
        title: "合併後的任務",
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
      sourceTaskIds: ["task-1", "task-2"],
    }),
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
    mockMergePreview: mockMergePreviewData,
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

describe("MergeDialog", () => {
  const mockTasks: Task[] = [
    {
      id: "task-1",
      title: "任務 1",
      status: "BACKLOG" as TaskStatus,
      priority: "HIGH" as Priority,
      orderIndex: 0,
      dependencies: [],
      assignees: [{ id: "user-1", name: "張三", avatarUrl: undefined }],
      childCount: 0,
      createdBy: { id: "user-1", name: "張三" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-2",
      title: "任務 2",
      status: "IN_PROGRESS" as TaskStatus,
      priority: "LOW" as Priority,
      orderIndex: 1,
      dependencies: [],
      assignees: [{ id: "user-2", name: "李四", avatarUrl: undefined }],
      childCount: 1,
      createdBy: { id: "user-2", name: "李四" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    selectedTasks: mockTasks,
    onMergeComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("對話框開關", () => {
    it("open 為 true 時對話框可見", () => {
      render(<MergeDialog {...defaultProps} />);
      expect(screen.getByText("合併任務")).toBeInTheDocument();
    });

    it("open 為 false 時對話框不渲染內容", () => {
      render(<MergeDialog {...defaultProps} open={false} />);
      expect(screen.queryByText("合併任務")).not.toBeInTheDocument();
    });
  });

  describe("預覽載入", () => {
    it("成功載入後顯示選擇的任務列表", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("任務 1")).toBeInTheDocument();
        expect(screen.getByText("任務 2")).toBeInTheDocument();
      });
    });

    it("正確顯示任務數量", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("已選擇 2 個任務")).toBeInTheDocument();
      });
    });

    it("每個任務顯示標題和優先級", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("任務 1")).toBeInTheDocument();
        expect(screen.getByText("優先級: HIGH")).toBeInTheDocument();
      });
    });
  });

  describe("衝突顯示", () => {
    it("有衝突時顯示警告區塊", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("⚠️ 衝突欄位")).toBeInTheDocument();
      });
    });
  });

  describe("負責人顯示", () => {
    it("合併後包含負責人時顯示", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("負責人（將合併所有人）")).toBeInTheDocument();
        expect(screen.getByText("張三")).toBeInTheDocument();
        expect(screen.getByText("李四")).toBeInTheDocument();
      });
    });
  });

  describe("警告訊息", () => {
    it("顯示子任務將刪除的警告", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("⚠️ 子任務將隨來源任務刪除")).toBeInTheDocument();
      });
    });
  });

  describe("取消行為", () => {
    it("點擊取消按鈕呼叫 onOpenChange(false)", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("合併任務")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: "取消" });
      fireEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("提交行為", () => {
    it("提交成功後呼叫 onMergeComplete 並關閉對話框", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("合併任務")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: "合併任務" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onMergeComplete).toHaveBeenCalled();
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("提交時呼叫 API", async () => {
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("合併任務")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: "合併任務" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(taskServiceMock.mergeTasks).toHaveBeenCalled();
      });
    });
  });

  describe("錯誤處理", () => {
    it("預覽載入失敗關閉對話框並顯示錯誤", async () => {
      taskServiceMock.mergePreview.mockRejectedValue(new Error("載入失敗"));
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "載入預覽失敗",
            variant: "destructive",
          })
        );
      });
    });

    it("合併失敗顯示錯誤 toast", async () => {
      taskServiceMock.mergePreview.mockResolvedValue(mockMergePreview);
      taskServiceMock.mergeTasks.mockRejectedValue(new Error("合併失敗"));
      render(<MergeDialog {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("合併任務")).toBeInTheDocument();
      });

      const submitButton = await screen.findByRole("button", { name: "合併任務" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "合併失敗",
            variant: "destructive",
          })
        );
      });
    });
  });
});
