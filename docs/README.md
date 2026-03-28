# 文檔中心

> **最後更新**: 2026-03-28 | **版本**: v1.0.0

---

## 📚 文檔導覽

### 用戶文檔

| 文檔 | 說明 |
|------|------|
| [使用手冊](user/01-user-guide.md) | 一般用戶操作指南，包含所有功能的使用說明 |

### 開發者文檔

| 文檔 | 說明 |
|------|------|
| [API 清單](api/01-api-list.md) | 所有 REST API 端點的詳細說明 |
| [資料庫 Schema](database/01-database-schema.md) | 資料庫結構、表格關係、欄位說明 |
| [測試項目列表](testing/01-test-list.md) | 現有測試項目總覽與覆蓋範圍 |

### 專案開檔文檔

| 文檔 | 說明 |
|------|------|
| [專案概覽](develope/01-project-overview.md) | 專案背景、目標與現況 |
| [技術棧](develope/02-tech-stack.md) | 使用的技術與工具 |
| [功能規格](develope/06-features.md) | 功能詳細規格 |
| [部署指南](develope/07-deployment.md) | 部署方式與注意事項 |

### 任務階層升級計畫 (v2.0)

> 任務重組功能：父子任務、合併、拆分、轉為專案

| 文檔 | 說明 |
|------|------|
| [實作總覽](develope/08-task-hierarchy-plan.md) | 計畫總覽與階段規劃 |
| [資料庫模型](develope/09-database-model.md) | Schema 變更設計 |
| [API 規格](develope/10-api-design.md) | 新 API 端點設計 |
| [父子任務功能](develope/11-subtask-feature.md) | 父子任務功能詳細規格 |
| [任務合併功能](develope/12-merge-feature.md) | 任務合併功能詳細規格 |
| [任務拆分功能](develope/13-split-feature.md) | 任務拆分功能詳細規格 |
| [轉為專案功能](develope/14-convert-project-feature.md) | 轉為專案功能詳細規格 |
| [前端元件規劃](develope/15-frontend-components.md) | 前端元件架構與設計 |

---

## 🚀 快速連結

- **主 README**: [../../README.md](../../README.md)
- **後端入口**: [backend/src/index.ts](../../backend/src/index.ts)
- **前端入口**: [frontend/src/App.tsx](../../frontend/src/App.tsx)
- **資料庫 Schema**: [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)

---

## 📋 文檔維護

| 項目 | 說明 |
|------|------|
| 更新頻率 | 如有 API 或結構變更，請同步更新對應文檔 |
| 版本標記 | 每個文檔頂部有「最後更新」與「版本」 |
| 問題回報 | 請至 [GitHub Issues](https://github.com/mini-ytssamuel/TaskManager-dev/issues) |

---

## 📁 文檔結構

```
docs/
├── README.md                 # 本文件 - 文檔入口
│
├── api/                      # API 文檔
│   └── 01-api-list.md       # 完整 API 端點清單
│
├── database/                 # 資料庫文檔
│   └── 01-database-schema.md # 資料庫 Schema 說明
│
├── testing/                  # 測試文檔
│   └── 01-test-list.md      # 測試項目列表
│
├── user/                    # 用戶文檔
│   └── 01-user-guide.md     # 使用手冊
│
└── develope/                # 開發者文檔
    ├── 01-project-overview.md
    ├── 02-tech-stack.md
    ├── 06-features.md
    ├── 07-deployment.md
    ├── 08-task-hierarchy-plan.md    # 任務階層升級 - 總覽
    ├── 09-database-model.md         # 任務階層升級 - 資料庫模型
    ├── 10-api-design.md             # 任務階層升級 - API 設計
    ├── 11-subtask-feature.md       # 任務階層升級 - 父子任務
    ├── 12-merge-feature.md         # 任務階層升級 - 任務合併
    ├── 13-split-feature.md         # 任務階層升級 - 任務拆分
    ├── 14-convert-project-feature.md  # 任務階層升級 - 轉為專案
    └── 15-frontend-components.md   # 任務階層升級 - 前端元件
```
