# 前端新功能測試計劃

## 1. 概覽

本文檔描述任務管理系統新功能的前端測試計劃，包括：
- **父子任務系統** (SubtaskList, AddSubtaskDialog)
- **任務合併** (MergeDialog, SelectionToolbar)
- **任務拆分** (SplitDialog)
- **轉換為專案** (ConvertToProjectDialog)

### 測試環境

| 項目 | 技術 |
|------|------|
| 單元測試 | Vitest + React Testing Library |
| E2E 測試 | Playwright |
| API | 連接真實後端 API |
| 前端運行 URL | http://localhost:5173 |

### 元件優先級

| 優先級 | 元件 | 原因 |
|--------|------|------|
| P0 | SelectionToolbar | 多選模式基礎，其他功能依賴 |
| P0 | MergeDialog | 核心功能，用戶主要操作 |
| P1 | SubtaskList | 父子任務顯示核心元件 |
| P1 | AddSubtaskDialog | 子任務新增功能 |
| P2 | SplitDialog | 任務拆分次要功能 |
| P2 | ConvertToProjectDialog | 轉換功能使用頻率較低 |

---

## 2. 單元測試 (Vitest)

### 2.1 SelectionToolbar 元件測試

**檔案位置**: `frontend/src/__tests__/components/SelectionToolbar.test.tsx`

#### 測試案例

```typescript
describe("SelectionToolbar", () => {
  // 正常情況
  describe("多選模式按鈕顯示", () => {
    test("非多選模式時顯示「多選模式」按鈕", () => { ... })
    test("點擊後進入多選模式", () => { ... })
  })

  // 狀態顯示
  describe("多選模式狀態", () => {
    test("已選擇 0 個任務時顯示「多選模式」和「退出」按鈕", () => { ... })
    test("已選擇 > 0 個任務時顯示已選擇數量和操作按鈕", () => { ... })
    test("選擇數量正確更新", () => { ... })
  })

  // 按鈕狀態
  describe("合併按鈕狀態", () => {
    test("選擇 < 2 個任務時合併按鈕禁用", () => { ... })
    test("選擇 >= 2 個任務時合併按鈕啟用", () => { ... })
  })

  // 操作回調
  describe("操作回調", () => {
    test("點擊合併按鈕呼叫 onMerge", () => { ... })
    test("點擊轉為專案按鈕呼叫 onConvertToProject", () => { ... })
    test("點擊取消按鈕呼叫 onClearSelection", () => { ... })
    test("點擊退出按鈕呼叫 onToggleSelectionMode", () => { ... })
  })

  // 快捷鍵 (如有實作)
  describe("快捷鍵支援", () => {
    test("Escape 鍵退出多選模式", () => { ... })
    test("M 鍵開啟合併對話框", () => { ... })
    test("P 鍵開啟轉換對話框", () => { ... })
  })
})
```

### 2.2 AddSubtaskDialog 元件測試

**檔案位置**: `frontend/src/__tests__/components/AddSubtaskDialog.test.tsx`

#### 測試案例

```typescript
describe("AddSubtaskDialog", () => {
  // 對話框基本行為
  describe("對話框開關", () => {
    test("open 為 true 時對話框可見", () => { ... })
    test("open 為 false 時對話框隱藏", () => { ... })
    test("點擊取消按鈕呼叫 onOpenChange(false)", () => { ... })
  })

  // 表單顯示
  describe("表單顯示", () => {
    test("顯示父任務標題", () => { ... })
    test("任務標題輸入框存在", () => { ... })
    test("描述輸入框存在", () => { ... })
    test("優先級選擇器存在且預設為 MEDIUM", () => { ... })
  })

  // 表單驗證
  describe("表單驗證", () => {
    test("標題為空時顯示錯誤提示", () => {
      // 嘗試提交空表單
      // 預期：顯示「請輸入任務標題」
    })
    test("標題必填驗證", () => { ... })
  })

  // 提交行為
  describe("提交行為", () => {
    test("填寫必填欄位後提交呼叫 taskService.createSubtask", () => {
      // Mock taskService.createSubtask
      // 填寫標題、描述、優先級
      // 點擊建立
      // 驗證 API 被正確呼叫
    })
    test("提交成功後呼叫 onSubtaskCreated", () => { ... })
    test("提交成功後對話框關閉", () => { ... })
    test("提交成功後表單重置", () => { ... })
    test("提交中按鈕顯示「建立中...」", () => { ... })
    test("提交中禁用提交按鈕", () => { ... })
  })

  // API 錯誤處理
  describe("錯誤處理", () => {
    test("API 失敗顯示錯誤 toast", () => {
      // Mock API 失敗
      // 提交表單
      // 驗證錯誤提示
    })
    test("API 失敗後對話框保持開啟", () => { ... })
    test("API 失敗後按鈕恢復可用", () => { ... })
  })

  // 優先級選項
  describe("優先級選項", () => {
    test("顯示所有 4 個優先級選項", () => { ... })
    test("可以選擇不同優先級", () => { ... })
  })
})
```

### 2.3 SubtaskList 元件測試

**檔案位置**: `frontend/src/__tests__/components/SubtaskList.test.tsx`

#### 測試案例

```typescript
describe("SubtaskList", () => {
  // 無子任務狀態
  describe("無子任務時", () => {
    test("顯示「新增子任務」按鈕", () => { ... })
    test("點擊新增子任務按鈕呼叫 onAddSubtask", () => { ... })
  })

  // 有子任務狀態
  describe("有子任務時", () => {
    test("顯示「子任務 (數量)」按鈕", () => { ... })
    test("展開箭頭初始為 ChevronRight", () => { ... })
    test("點擊展開顯示子任務列表", () => { ... })
    test("展開後箭頭變為 ChevronDown", () => { ... })
    test("再次點擊可收起列表", () => { ... })
  })

  // 子任務顯示
  describe("子任務顯示", () => {
    test("正確顯示子任務標題", () => { ... })
    test("正確顯示優先級 Badge", () => { ... })
    test("有子任務的顯示數量 Badge", () => { ... })
    test("點擊子任務呼叫 onSubtaskClick", () => { ... })
  })

  // 載入狀態
  describe("載入狀態", () => {
    test("展開時顯示「載入中...」", () => { ... })
    test("載入完成後顯示子任務", () => { ... })
  })

  // API 互動
  describe("API 互動", () => {
    test("展開時呼叫 taskService.getSubtasks", () => {
      // Mock API
      // 展開列表
      // 驗證 API 被呼叫
    })
    test("正確傳遞 taskId", () => { ... })
  })

  // 空狀態
  describe("空狀態", () => {
    test("無子任務時顯示「尚無子任務」", () => { ... })
  })
})
```

### 2.4 MergeDialog 元件測試

**檔案位置**: `frontend/src/__tests__/components/MergeDialog.test.tsx`

#### 測試案例

```typescript
describe("MergeDialog", () => {
  // 基本行為
  describe("對話框開關", () => {
    test("open 為 true 時對話框可見", () => { ... })
    test("open 為 false 時對話框隱藏", () => { ... })
  })

  // 預覽載入
  describe("預覽載入", () => {
    test("開啟時顯示「載入預覽中...」", () => { ... })
    test("成功載入後顯示選擇的任務列表", () => { ... })
    test("正確顯示任務數量", () => { ... })
    test("每個任務顯示標題和優先級", () => { ... })
  })

  // 衝突顯示
  describe("衝突欄位顯示", () => {
    test("有衝突時顯示警告區塊", () => { ... })
    test("衝突數量正確顯示", () => { ... })
    test("每個衝突顯示 RadioGroup 選項", () => { ... })
    test("可選擇不同衝突值", () => { ... })
    test("建議值標記為「(建議)」", () => { ... })
  })

  // 無衝突情況
  describe("無衝突時", () => {
    test("不顯示衝突區塊", () => { ... })
    test("表單使用預覽值填充", () => { ... })
  })

  // 表單欄位
  describe("表單欄位", () => {
    test("標題輸入框存在且必填", () => { ... })
    test("描述輸入框存在", () => { ... })
    test("優先級預設值正確", () => { ... })
    test("狀態預設值正確", () => { ... })
  })

  // 負責人顯示
  describe("負責人顯示", () => {
    test("合併後包含負責人時顯示", () => { ... })
    test("正確顯示所有負責人名稱", () => { ... })
  })

  // 警告訊息
  describe("警告訊息", () => {
    test("顯示子任務將刪除的警告", () => { ... })
  })

  // 提交行為
  describe("提交行為", () => {
    test("填寫必填欄位後提交呼叫 API", () => {
      // Mock taskService.mergeTasks
      // 填寫表單
      // 提交
      // 驗證 API 呼叫
    })
    test("提交成功後呼叫 onMergeComplete", () => { ... })
    test("提交成功後對話框關閉", () => { ... })
    test("提交中顯示「合併中...」", () => { ... })
  })

  // API 錯誤處理
  describe("錯誤處理", () => {
    test("預覽載入失敗關閉對話框並顯示錯誤", () => { ... })
    test("合併失敗顯示錯誤 toast", () => { ... })
  })
})
```

### 2.5 SplitDialog 元件測試

**檔案位置**: `frontend/src/__tests__/components/SplitDialog.test.tsx`

#### 測試案例

```typescript
describe("SplitDialog", () => {
  // 基本行為
  describe("對話框開關", () => {
    test("open 爲 true 時對話框可見", () => { ... })
    test("open 爲 false 時對話框隱藏", () => { ... })
    test("取消按鈕關閉對話框", () => { ... })
  })

  // 原任務顯示
  describe("原任務顯示", () => {
    test("正確顯示原任務標題", () => { ... })
    test("正確顯示原任務描述", () => { ... })
  })

  // 分隔功能
  describe("--- 分隔功能", () => {
    test("描述框初始值為原任務描述", () => { ... })
    test("輸入 --- 時自動分割任務", () => {
      // 輸入 "part1\n---\npart2"
      // 驗證 splits 更新為 2 個
    })
    test("分割後標題自動編號", () => {
      // 3 個部分
      // 驗證標題為 "原標題 (1/3)", "原標題 (2/3)", "原標題 (3/3)"
    })
    test("分割後描述正確分配", () => { ... })
  })

  // 手動新增/刪除任務
  describe("任務管理", () => {
    test("預設 2 個分割任務", () => { ... })
    test("可點擊新增任務", () => {
      // 點擊新增
      // 驗證 splits.length = 3
    })
    test("任務數 > 2 時可刪除", () => {
      // 新增到 3 個
      // 刪除第 3 個
      // 驗證 splits.length = 2
    })
    test("任務數 = 2 時不可刪除", () => { ... })
  })

  // 個別任務編輯
  describe("任務編輯", () => {
    test("可編輯分割任務標題", () => { ... })
    test("可編輯分割任務描述", () => { ... })
    test("可選擇分割任務優先級", () => { ... })
  })

  // 提交驗證
  describe("提交驗證", () => {
    test("有效任務 < 2 時顯示錯誤", () => {
      // 填寫不完整的分割
      // 點擊提交
      // 驗證錯誤提示
    })
    test("有效任務 >= 2 時可提交", () => { ... })
  })

  // 提交行為
  describe("提交行為", () => {
    test("提交呼叫 taskService.splitTask", () => {
      // Mock API
      // 填寫有效分割
      // 提交
      // 驗證 API
    })
    test("提交成功呼叫 onSplitComplete", () => { ... })
    test("提交成功關閉對話框", () => { ... })
  })

  // 警告訊息
  describe("警告訊息", () => {
    test("顯示子任務將刪除的警告", () => { ... })
    test("顯示依賴關係轉移警告", () => { ... })
    test("顯示留言轉移警告", () => { ... })
  })
})
```

### 2.6 ConvertToProjectDialog 元件測試

**檔案位置**: `frontend/src/__tests__/components/ConvertToProjectDialog.test.tsx`

#### 測試案例

```typescript
describe("ConvertToProjectDialog", () => {
  // 基本行為
  describe("對話框開關", () => {
    test("open 為 true 時對話框可見", () => { ... })
    test("open 為 false 時對話框隱藏", () => { ... })
    test("取消按鈕關閉對話框", () => { ... })
  })

  // 任務列表顯示
  describe("任務列表顯示", () => {
    test("正確顯示選擇的任務數量", () => { ... })
    test("每個任務顯示標題", () => { ... })
    test("有子任務的顯示子任務數量", () => { ... })
    test("正確計算總任務數（含子任務）", () => { ... })
  })

  // 表單欄位
  describe("表單欄位", () => {
    test("專案名稱輸入框存在且必填", () => { ... })
    test("專案描述輸入框存在", () => { ... })
    test("驗證失敗顯示錯誤提示", () => { ... })
  })

  // 提交行為
  describe("提交行為", () => {
    test("填寫必填欄位後提交呼叫 API", () => {
      // Mock taskService.convertToProject
      // 填寫專案名稱
      // 提交
      // 驗證 API 呼叫
    })
    test("提交成功後呼叫 onConvertComplete", () => { ... })
    test("提交成功後導航到新專案", () => {
      // 驗證 navigate 被呼叫
      // 驗證 URL 包含新專案 ID
    })
    test("提交中顯示「處理中...」", () => { ... })
  })

  // API 錯誤處理
  describe("錯誤處理", () => {
    test("轉換失敗顯示錯誤 toast", () => { ... })
    test("轉換失敗後對話框保持開啟", () => { ... })
    test("轉換失敗後按鈕恢復可用", () => { ... })
  })

  // 警告訊息
  describe("警告訊息", () => {
    test("顯示任務移出原專案警告", () => { ... })
    test("顯示子任務隨行警告", () => { ... })
    test("顯示成員不自動加入警告", () => { ... })
    test("顯示跨專案依賴警告", () => { ... })
  })
})
```

---

## 3. E2E 測試 (Playwright)

### 3.1 測試前置條件

所有 E2E 測試需要：
1. 後端 API 運行於 localhost:3000
2. 前端運行於 localhost:5173
3. 測試用戶已登入

### 3.2 SelectionToolbar E2E 測試

**檔案位置**: `frontend/e2e/selection-toolbar.spec.ts`

```typescript
describe("SelectionToolbar E2E", () => {
  // 多選模式進入/退出
  test("進入和退出多選模式", async ({ page }) => {
    await page.goto("/project/test-project");
    // 等待看板載入
    
    // 點擊多選模式按鈕
    await page.getByText("多選模式").click();
    
    // 驗證進入多選模式
    await expect(page.getByText("多選模式")).toBeVisible();
    await expect(page.getByText("退出")).toBeVisible();
    
    // 點擊退出
    await page.getByText("退出").click();
    
    // 驗證退出多選模式
    await expect(page.getByText("多選模式")).toBeVisible();
  });

  // 任務選擇
  test("選擇單個任務", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 進入多選模式
    await page.getByText("多選模式").click();
    
    // 點擊任務
    await page.locator(".task-card").first().click();
    
    // 驗證已選擇 1 個任務
    await expect(page.getByText("已選擇 1 個任務")).toBeVisible();
  });

  // 範圍選擇 (Shift + 點擊)
  test("Shift + 點擊範圍選擇", async ({ page }) => {
    await page.goto("/project/test-project");
    await page.getByText("多選模式").click();
    
    // Shift + 點擊第一個和第三個任務
    await page.locator(".task-card").nth(0).click();
    await page.locator(".task-card").nth(2).click({ modifiers: ["Shift"] });
    
    // 驗證選擇了 3 個任務
    await expect(page.getByText("已選擇 3 個任務")).toBeVisible();
  });

  // 合併按鈕狀態
  test("合併按鈕禁用/啟用狀態", async ({ page }) => {
    await page.goto("/project/test-project");
    await page.getByText("多選模式").click();
    
    // 選擇 1 個任務 - 合併按鈕禁用
    await page.locator(".task-card").first().click();
    await expect(page.getByRole("button", { name: "合併" })).toBeDisabled();
    
    // 選擇 2 個任務 - 合併按鈕啟用
    await page.locator(".task-card").nth(1).click();
    await expect(page.getByRole("button", { name: "合併" })).toBeEnabled();
  });

  // 取消選擇
  test("取消選擇", async ({ page }) => {
    await page.goto("/project/test-project");
    await page.getByText("多選模式").click();
    
    // 選擇任務
    await page.locator(".task-card").first().click();
    await expect(page.getByText("已選擇 1 個任務")).toBeVisible();
    
    // 點擊取消
    await page.getByRole("button", { name: "取消" }).click();
    
    // 驗證已清除選擇
    await expect(page.getByText("已選擇 1 個任務")).not.toBeVisible();
  });
});
```

### 3.3 子任務功能 E2E 測試

**檔案位置**: `frontend/e2e/subtask.spec.ts`

```typescript
describe("子任務功能 E2E", () => {
  // 新增子任務完整流程
  test("新增子任務", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 找到有子任務按鈕的任務
    const parentTask = page.locator(".task-card").filter({ hasText: "測試任務" }).first();
    
    // 點擊新增子任務
    await parentTask.getByText("新增子任務").click();
    
    // 對話框出現
    await expect(page.getByText("新增子任務")).toBeVisible();
    
    // 填寫表單
    await page.getByLabel("任務標題").fill("子任務測試");
    await page.getByLabel("描述（可選）").fill("這是子任務描述");
    await page.getByLabel("優先級").selectOption("HIGH");
    
    // 提交
    await page.getByRole("button", { name: "建立" }).click();
    
    // 驗證成功
    await expect(page.getByText("子任務已建立")).toBeVisible();
    
    // 對話框關閉
    await expect(page.getByText("新增子任務")).not.toBeVisible();
    
    // 子任務列表更新
    await parentTask.getByText(/子任務 \(1\)/).click();
    await expect(page.getByText("子任務測試")).toBeVisible();
  });

  // 查看子任務列表
  test("查看子任務列表", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 點擊展開子任務
    await page.locator(".task-card").first().getByText(/子任務 \(\d+\)/).click();
    
    // 等待載入
    await expect(page.getByText("載入中...")).toBeVisible();
    
    // 驗證顯示子任務
    await expect(page.locator(".subtask-item")).toHaveCount(2);
  });

  // 點擊子任務
  test("點擊子任務開啟詳情", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 展開並點擊子任務
    await page.locator(".task-card").first().getByText(/子任務 \(\d+\)/).click();
    await page.locator(".subtask-item").first().click();
    
    // 驗證子任務詳情彈出
    await expect(page.getByText("子任務標題")).toBeVisible();
  });
});
```

### 3.4 任務合併 E2E 測試

**檔案位置**: `frontend/e2e/merge.spec.ts`

```typescript
describe("任務合併 E2E", () => {
  // 基本合併流程
  test("合併兩個任務", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 進入多選模式
    await page.getByText("多選模式").click();
    
    // 選擇 2 個任務
    await page.locator(".task-card").nth(0).click();
    await page.locator(".task-card").nth(1).click();
    
    // 點擊合併
    await page.getByRole("button", { name: "合併" }).click();
    
    // 對話框出現
    await expect(page.getByText("合併任務")).toBeVisible();
    
    // 填寫合併後標題
    await page.getByLabel("合併後標題").fill("合併後的新任務");
    
    // 提交
    await page.getByRole("button", { name: "合併任務" }).click();
    
    // 驗證成功
    await expect(page.getByText("任務合併成功")).toBeVisible();
    
    // 驗證只剩一個任務
    await expect(page.locator(".task-card")).toHaveCount(4); // 原本 6 個 - 2 個 + 1 個
  });

  // 有衝突的合併
  test("合併有衝突的任務", async ({ page }) => {
    await page.goto("/project/test-project");
    await page.getByText("多選模式").click();
    
    // 選擇優先級不同的 2 個任務
    await page.locator(".task-card").nth(0).click(); // HIGH
    await page.locator(".task-card").nth(1).click(); // LOW
    
    await page.getByRole("button", { name: "合併" }).click();
    
    // 驗證衝突區塊出現
    await expect(page.getByText("⚠️ 衝突欄位")).toBeVisible();
    await expect(page.getByText("priority")).toBeVisible();
    
    // 選擇其中一個優先級
    await page.getByText("HIGH").first().click();
    
    // 填寫標題並提交
    await page.getByLabel("合併後標題").fill("衝突任務合併");
    await page.getByRole("button", { name: "合併任務" }).click();
    
    // 驗證成功
    await expect(page.getByText("任務合併成功")).toBeVisible();
  });

  // 合併後子任務處理
  test("合併後子任務被刪除", async ({ page }) => {
    await page.goto("/project/test-project");
    await page.getByText("多選模式").click();
    
    // 選擇有子任務的任務
    await page.locator(".task-card").nth(0).click();
    await page.locator(".task-card").nth(1).click();
    
    await page.getByRole("button", { name: "合併" }).click();
    
    // 填寫並提交
    await page.getByLabel("合併後標題").fill("測試合併");
    await page.getByRole("button", { name: "合併任務" }).click();
    
    // 驗證警告顯示
    await expect(page.getByText("子任務將隨來源任務刪除")).toBeVisible();
  });
});
```

### 3.5 任務拆分 E2E 測試

**檔案位置**: `frontend/e2e/split.spec.ts`

```typescript
describe("任務拆分 E2E", () => {
  // 基本拆分流程
  test("使用 --- 分隔符拆分任務", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 選擇一個任務
    await page.locator(".task-card").first().click();
    
    // 等待詳情彈出
    await page.getByText("拆分").click();
    
    // 對話框出現
    await expect(page.getByText("拆分任務")).toBeVisible();
    
    // 填寫分隔描述
    await page.getByLabel("使用 --- 分隔各任務內容").fill(
      "第一部分內容\n---\n第二部分內容"
    );
    
    // 驗證自動生成 2 個任務預覽
    await expect(page.getByText("任務 1")).toBeVisible();
    await expect(page.getByText("任務 2")).toBeVisible();
    
    // 提交
    await page.getByRole("button", { name: "確認拆分" }).click();
    
    // 驗證成功
    await expect(page.getByText("任務拆分成功")).toBeVisible();
  });

  // 手動新增拆分任務
  test("手動新增拆分任務", async ({ page }) => {
    await page.goto("/project/test-project");
    
    await page.locator(".task-card").first().click();
    await page.getByText("拆分").click();
    
    // 新增一個任務
    await page.getByRole("button", { name: "新增一個任務" }).click();
    
    // 驗證變成 3 個任務
    await expect(page.getByText("預覽分割結果 (3 個任務)")).toBeVisible();
    
    // 可刪除第 3 個
    await page.getByRole("button", { name: "刪除" }).click();
    
    // 驗證回到 2 個
    await expect(page.getByText("預覽分割結果 (2 個任務)")).toBeVisible();
  });

  // 編輯拆分任務
  test("編輯個別拆分任務", async ({ page }) => {
    await page.goto("/project/test-project");
    
    await page.locator(".task-card").first().click();
    await page.getByText("拆分").click();
    
    // 編輯第一個任務標題
    await page.locator('input[placeholder="任務標題"]').first().fill("修改後標題");
    
    // 提交
    await page.getByRole("button", { name: "確認拆分" }).click();
    
    // 驗證成功
    await expect(page.getByText("任務拆分成功")).toBeVisible();
  });

  // 驗證 - 無效拆分
  test("無效拆分顯示錯誤", async ({ page }) => {
    await page.goto("/project/test-project");
    
    await page.locator(".task-card").first().click();
    await page.getByText("拆分").click();
    
    // 只填寫 1 個任務（不清空默認值）
    // 提交
    await page.getByRole("button", { name: "確認拆分" }).click();
    
    // 驗證錯誤提示
    await expect(page.getByText("至少需要 2 個有效的拆分任務")).toBeVisible();
  });
});
```

### 3.6 轉換為專案 E2E 測試

**檔案位置**: `frontend/e2e/convert-project.spec.ts`

```typescript
describe("轉換為專案 E2E", () => {
  // 基本轉換流程
  test("將任務轉換為新專案", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 進入多選模式
    await page.getByText("多選模式").click();
    
    // 選擇任務
    await page.locator(".task-card").first().click();
    await page.locator(".task-card").nth(1).click();
    
    // 點擊轉為專案
    await page.getByRole("button", { name: "轉為專案" }).click();
    
    // 對話框出現
    await expect(page.getByText("將任務轉為專案")).toBeVisible();
    
    // 填寫專案資訊
    await page.getByLabel("新專案名稱").fill("新專案名稱");
    await page.getByLabel("專案描述（可選）").fill("專案描述");
    
    // 提交
    await page.getByRole("button", { name: "建立專案並轉移" }).click();
    
    // 驗證成功
    await expect(page.getByText("已建立新專案")).toBeVisible();
    
    // 驗證導航到新專案
    await expect(page).toHaveURL(/\/project\/.+/);
  });

  // 驗證 - 必填欄位
  test("專案名稱必填驗證", async ({ page }) => {
    await page.goto("/project/test-project");
    await page.getByText("多選模式").click();
    
    await page.locator(".task-card").first().click();
    await page.getByRole("button", { name: "轉為專案" }).click();
    
    // 不填寫專案名稱直接提交
    await page.getByRole("button", { name: "建立專案並轉移" }).click();
    
    // 驗證錯誤提示
    await expect(page.getByText("請輸入專案名稱")).toBeVisible();
  });

  // 轉換帶子任務的任務
  test("轉換帶子任務的任務", async ({ page }) => {
    await page.goto("/project/test-project");
    await page.getByText("多選模式").click();
    
    // 選擇有子任務的任務
    await page.locator(".task-card").first().click();
    
    await page.getByRole("button", { name: "轉為專案" }).click();
    
    // 驗證顯示子任務數量
    await expect(page.getByText(/(含 \d+ 個子任務)/)).toBeVisible();
    
    // 驗證總任務數正確
    await expect(page.getByText(/共 \d+ 個任務/)).toBeVisible();
  });

  // 轉換後原專案任務減少
  test("轉換後原專案任務減少", async ({ page }) => {
    await page.goto("/project/test-project");
    
    // 記錄原始任務數
    const originalCount = await page.locator(".task-card").count();
    
    await page.getByText("多選模式").click();
    await page.locator(".task-card").first().click();
    await page.getByRole("button", { name: "轉為專案" }).click();
    
    await page.getByLabel("新專案名稱").fill("測試專案");
    await page.getByRole("button", { name: "建立專案並轉移" }).click();
    
    // 驗證任務數減少
    await expect(page.locator(".task-card")).toHaveCount(originalCount - 1);
  });
});
```

---

## 4. 測試執行

### 4.1 執行所有測試

```bash
# 單元測試
cd frontend && npm test

# E2E 測試
cd frontend && npm run test:e2e
```

### 4.2 執行特定測試檔案

```bash
# 單元測試
cd frontend && npm test -- SelectionToolbar.test

# E2E 測試
cd frontend && npx playwright test merge.spec.ts
```

### 4.3 測試覆蓋率目標

| 類型 | 目標覆蓋率 |
|------|-----------|
| 單元測試 | 新元件 90%+ 行覆蓋 |
| E2E 測試 | 主要流程 100% 覆蓋 |

---

## 5. Mock 策略

### 5.1 API Mock

由於使用真實後端，E2E 測試直接使用真實 API。但單元測試需要 Mock：

```typescript
// src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const taskHandlers = [
  http.get("/api/tasks/:id/subtasks", () => {
    return HttpResponse.json({
      subtasks: [...],
      totalCount: 2
    });
  }),
  http.post("/api/tasks/:id/subtasks", () => {
    return HttpResponse.json({ ... });
  }),
  http.post("/api/tasks/merge/preview", () => {
    return HttpResponse.json({ ... });
  }),
  http.post("/api/tasks/merge", () => {
    return HttpResponse.json({ ... });
  }),
  http.post("/api/tasks/:id/split", () => {
    return HttpResponse.json({ ... });
  }),
  http.post("/api/tasks/convert-to-project", () => {
    return HttpResponse.json({ ... });
  }),
];
```

### 5.2 Toast Mock

```typescript
// src/__tests__/mocks/toast.ts
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
```

---

## 6. 風險與注意事項

### 6.1 測試環境風險

| 風險 | 緩解措施 |
|------|----------|
| 後端 API 不穩定 | E2E 測試前檢查 API 健康狀態 |
| 測試資料殘留 | 每個測試使用 unique 資料或 cleanup |
| 前端熱重載影響 | 使用 `--ui` 模式除錯 |

### 6.2 測試穩定性

| 問題 | 解決方案 |
|------|----------|
| 隨機失敗 | 增加适当的 `waitFor` |
| 選擇器不穩定 | 使用 `data-testid` |
| 競態條件 | 使用 `page.waitForResponse` |

---

## 7. 測試產出文件

測試完成後應產生：

1. **測試報告**: `frontend/test-results/`
2. **覆蓋率報告**: `frontend/coverage/`
3. **截圖/錄影**: `frontend/test-results/screenshots/`

---

## 8. 審核清單

- [ ] 測試計劃文件審核
- [ ] Mock 策略確認
- [ ] 測試資料準備
- [ ] CI/CD 整合規劃
- [ ] 測試執行時間預估

---

## 9. 實作狀態 (2026-04-08)

### 已完成

#### 單元測試
| 元件 | 檔案 | 狀態 | 通過/總數 |
|------|------|------|----------|
| SelectionToolbar | `src/__tests__/components/SelectionToolbar.test.tsx` | ✅ 完成 | 13/13 |
| MergeDialog | `src/__tests__/components/MergeDialog.test.tsx` | ⚠️ 部分完成 | 17/23 |
| App.test.tsx | `src/__tests__/App.test.tsx` | ✅ 完成 | 13/13 |

#### E2E 測試
| 元件 | 檔案 | 狀態 |
|------|------|------|
| SelectionToolbar E2E | `e2e/selection-toolbar.spec.ts` | ✅ 完成 |

### 問題與待解決

#### 單元測試問題
1. **MergeDialog**: 6 個測試失敗主要是因為 UI 選擇器複雜度（RadioGroup、Dialog 疊加元素）
2. **SubtaskList**: Mock 數據與元件內部邏輯匹配問題，需要進一步調試

#### 技術債務
- 需要統一的 Mock 策略（目前每個測試檔案各自定義 Mock）
- Dialog 組件測試需要特殊的異步處理

### 下一步

1. [ ] 修復 MergeDialog 的 6 個失敗測試
2. [ ] 修復 SubtaskList 的 Mock 問題
3. [ ] 完成 AddSubtaskDialog 單元測試
4. [ ] 完成 SplitDialog 單元測試
5. [ ] 完成 ConvertToProjectDialog 單元測試
6. [ ] 完成所有 E2E 測試

### 測試執行結果

```
Test Files  2 failed | 2 passed (4)
Tests       20 failed | 45 passed (65)
```

---

*最後更新: 2026-04-08*
