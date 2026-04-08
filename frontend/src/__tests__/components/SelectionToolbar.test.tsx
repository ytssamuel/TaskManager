import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectionToolbar } from "@/components/SelectionToolbar";

describe("SelectionToolbar", () => {
  const defaultProps = {
    selectedCount: 0,
    onMerge: vi.fn(),
    onConvertToProject: vi.fn(),
    onClearSelection: vi.fn(),
    onToggleSelectionMode: vi.fn(),
    isSelectionMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("多選模式按鈕顯示", () => {
    it("非多選模式時顯示「多選模式」按鈕", () => {
      render(<SelectionToolbar {...defaultProps} />);
      expect(screen.getByText("多選模式")).toBeInTheDocument();
    });

    it("點擊後進入多選模式", () => {
      const props = { ...defaultProps, onToggleSelectionMode: vi.fn() };
      render(<SelectionToolbar {...props} />);
      fireEvent.click(screen.getByText("多選模式"));
      expect(props.onToggleSelectionMode).toHaveBeenCalledTimes(1);
    });
  });

  describe("多選模式狀態", () => {
    it("已選擇 0 個任務時顯示「多選模式」和「退出」按鈕", () => {
      render(<SelectionToolbar {...defaultProps} isSelectionMode={true} />);
      expect(screen.getByText("多選模式")).toBeInTheDocument();
      expect(screen.getByText("退出")).toBeInTheDocument();
    });

    it("已選擇 > 0 個任務時顯示已選擇數量和操作按鈕", () => {
      render(<SelectionToolbar {...defaultProps} isSelectionMode={true} selectedCount={3} />);
      expect(screen.getByText("已選擇 3 個任務")).toBeInTheDocument();
      expect(screen.getByText("合併")).toBeInTheDocument();
      expect(screen.getByText("轉為專案")).toBeInTheDocument();
      expect(screen.getByText("取消")).toBeInTheDocument();
    });

    it("選擇數量正確更新", () => {
      render(<SelectionToolbar {...defaultProps} isSelectionMode={true} selectedCount={1} />);
      expect(screen.getByText("已選擇 1 個任務")).toBeInTheDocument();
    });

    it("選擇數量為 0 且在多選模式時不顯示合併/轉為專案按鈕", () => {
      render(<SelectionToolbar {...defaultProps} isSelectionMode={true} selectedCount={0} />);
      expect(screen.queryByText("合併")).not.toBeInTheDocument();
      expect(screen.queryByText("轉為專案")).not.toBeInTheDocument();
    });
  });

  describe("合併按鈕狀態", () => {
    it("選擇 < 2 個任務時合併按鈕禁用", () => {
      render(<SelectionToolbar {...defaultProps} isSelectionMode={true} selectedCount={1} />);
      expect(screen.getByText("合併").closest("button")).toBeDisabled();
    });

    it("選擇 >= 2 個任務時合併按鈕啟用", () => {
      render(<SelectionToolbar {...defaultProps} isSelectionMode={true} selectedCount={2} />);
      expect(screen.getByText("合併").closest("button")).toBeEnabled();
    });

    it("選擇 3 個任務時合併按鈕啟用", () => {
      render(<SelectionToolbar {...defaultProps} isSelectionMode={true} selectedCount={3} />);
      expect(screen.getByText("合併").closest("button")).toBeEnabled();
    });
  });

  describe("操作回調", () => {
    it("點擊合併按鈕呼叫 onMerge", () => {
      const props = { ...defaultProps, onMerge: vi.fn(), isSelectionMode: true, selectedCount: 2 };
      render(<SelectionToolbar {...props} />);
      fireEvent.click(screen.getByText("合併"));
      expect(props.onMerge).toHaveBeenCalledTimes(1);
    });

    it("點擊轉為專案按鈕呼叫 onConvertToProject", () => {
      const props = { ...defaultProps, onConvertToProject: vi.fn(), isSelectionMode: true, selectedCount: 1 };
      render(<SelectionToolbar {...props} />);
      fireEvent.click(screen.getByText("轉為專案"));
      expect(props.onConvertToProject).toHaveBeenCalledTimes(1);
    });

    it("點擊取消按鈕呼叫 onClearSelection", () => {
      const props = { ...defaultProps, onClearSelection: vi.fn(), isSelectionMode: true, selectedCount: 1 };
      render(<SelectionToolbar {...props} />);
      fireEvent.click(screen.getByText("取消"));
      expect(props.onClearSelection).toHaveBeenCalledTimes(1);
    });

    it("點擊退出按鈕呼叫 onToggleSelectionMode", () => {
      const props = { ...defaultProps, onToggleSelectionMode: vi.fn(), isSelectionMode: true, selectedCount: 0 };
      render(<SelectionToolbar {...props} />);
      fireEvent.click(screen.getByText("退出"));
      expect(props.onToggleSelectionMode).toHaveBeenCalledTimes(1);
    });
  });


});
