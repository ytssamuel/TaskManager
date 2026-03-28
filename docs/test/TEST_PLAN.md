# TaskManager E2E 測試計劃

## 現有測試

### 後端 (Vitest) - 32 tests
- `auth.test.ts` - 密碼雜湊、JWT、驗證 schema
- `integration.test.ts` - Auth/Project API 整合測試  
- `task-api.test.ts` - Task API 整合測試

### 前端 (Playwright) - 3 test files
- `e2e/home.spec.ts` - 首頁載入測試
- `e2e/login.spec.ts` - 登入流程測試
- `e2e/auth.spec.ts` - 註冊/登入/權限測試

---

## 測試覆蓋矩陣

| 功能 | 後端測試 | 前端 E2E |
|------|---------|---------|
| 用戶註冊 | ✅ | ✅ |
| 用戶登入 | ✅ | ✅ |
| 專案建立 | ✅ | ✅ |
| 專案列表 | ✅ | ✅ |
| 任務建立 | ✅ | ✅ |
| 任務列表 | ✅ | ✅ |
| 任務拖拽 | ❌ | ✅ |
| 主題切換 | ❌ | ✅ |

---

## 待完成

- [ ] CI/CD 測試流程

---

## 狀態: ✅ 完成

- 後端測試: 32 tests
- 前端 E2E: 7 test files
- 新增: 專案/任務/主題測試
