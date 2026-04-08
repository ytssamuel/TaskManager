import { Button } from "@/components/ui/button";
import { Merge, FolderInput, X, CheckSquare } from "lucide-react";

interface SelectionToolbarProps {
  selectedCount: number;
  onMerge: () => void;
  onConvertToProject: () => void;
  onClearSelection: () => void;
  onToggleSelectionMode: () => void;
  isSelectionMode: boolean;
}

export function SelectionToolbar({
  selectedCount,
  onMerge,
  onConvertToProject,
  onClearSelection,
  onToggleSelectionMode,
  isSelectionMode,
}: SelectionToolbarProps) {
  if (selectedCount === 0 && !isSelectionMode) {
    return (
      <div className="flex justify-center py-2">
        <Button variant="outline" size="sm" onClick={onToggleSelectionMode} className="text-xs">
          <CheckSquare className="h-3 w-3 mr-1" />
          多選模式
        </Button>
      </div>
    );
  }

  if (selectedCount === 0 && isSelectionMode) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 z-40">
        <span className="text-sm">多選模式</span>
        <Button variant="ghost" size="sm" onClick={onToggleSelectionMode}>
          <X className="h-3 w-3 mr-1" />
          退出
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 z-40">
      <span className="text-sm">已選擇 {selectedCount} 個任務</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onMerge} disabled={selectedCount < 2}>
          <Merge className="h-3 w-3 mr-1" />
          合併
        </Button>
        <Button size="sm" variant="outline" onClick={onConvertToProject}>
          <FolderInput className="h-3 w-3 mr-1" />
          轉為專案
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-3 w-3 mr-1" />
          取消
        </Button>
      </div>
    </div>
  );
}
