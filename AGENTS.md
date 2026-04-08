# AGENTS.md - TaskManager Development Guide

## Project Overview

TaskManager is a full-stack task management system with:
- **Backend**: Express.js + Prisma + TypeScript (port 3000)
- **Frontend**: React 18 + Vite + TailwindCSS + Zustand (port 5173)

---

## Project Structure

```
taskmanager/
├── backend/
│   ├── src/
│   │   ├── __tests__/          # Test files
│   │   ├── controllers/        # Route handlers
│   │   ├── middlewares/        # Express middleware
│   │   ├── routes/             # Express routes
│   │   ├── utils/              # Utilities (auth, prisma, response)
│   │   └── index.ts            # Entry point
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── __tests__/          # Test files
│   │   ├── components/         # React components
│   │   │   ├── ui/             # Base UI components
│   │   │   └── providers/      # Context providers
│   │   ├── pages/              # Page components
│   │   ├── store/              # Zustand stores
│   │   ├── lib/                # Types, utils, validations
│   │   ├── services/            # API services
│   │   ├── hooks/              # Custom hooks
│   │   └── main.tsx            # Entry point
│   └── vitest.config.ts
└── docs/                       # Documentation
```

---

## Commands

### Backend

```bash
cd backend

# Development
npm run dev              # Start dev server with hot reload (tsx watch)

# Build & Production
npm run build            # TypeScript compile (tsc -p tsconfig.build.json)
npm run start             # Start production server

# Code Quality
npm run lint              # ESLint (eslint src --ext .ts)

# Testing
npm run test              # Run all tests (vitest)
npm run test -- --run     # Run tests once (no watch)
npm run test src/__tests__/task-api.test.ts  # Run single test file
npm run test -- --coverage # With coverage report

# Database
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run prisma:studio     # Open Prisma Studio GUI
```

### Frontend

```bash
cd frontend

# Development
npm run dev               # Start Vite dev server

# Build & Production
npm run build             # TypeScript compile + Vite build
npm run preview           # Preview production build

# Code Quality
npm run lint              # ESLint (eslint . --ext ts,tsx)

# Testing
npm run test              # Run Vitest (vitest)
npm run test -- --run     # Run tests once
npm run test src/__tests__/components/MergeDialog.test.tsx  # Single test
npm run test -- --coverage # With coverage

# E2E Testing (Playwright)
npm run test:e2e          # Run Playwright tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:headed   # Run headed (visible browser)
```

---

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** in both backend (`strict: true`) and frontend
- **Path aliases**: Use `@/` prefix for imports
  - Backend: `@/controllers`, `@/routes`, `@/utils`, etc.
  - Frontend: `@/components`, `@/store`, `@/lib`, etc.
- **Consistent type imports**: Use `import type { Type }` for type-only imports

### Backend Conventions

#### Imports
```typescript
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
```

#### Response Format
Always use helper functions for responses:
```typescript
// Success
res.status(201).json(successResponse(createdTask));
res.json(successResponse({ tasks, columns }));

// Error
res.status(400).json(errorResponse("VALIDATION_ERROR", "錯誤訊息"));
res.status(404).json(errorResponse("NOT_FOUND", "資源不存在"));
```

#### Validation with Zod
Define schemas at the top of controller files:
```typescript
const createTaskSchema = z.object({
  title: z.string().min(1, "任務標題不能為空").max(200),
  status: z.enum(["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"]).default("BACKLOG"),
});
```

#### Error Handling
Controllers should use try/catch with `next(error)`:
```typescript
export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // ... logic
  } catch (error) {
    next(error);
  }
};
```

#### Middleware Pattern
- Auth middleware: `@/middlewares/auth.middleware`
- Error handler: `@/middlewares/error.middleware`
- API Key auth: `@/middlewares/api-key-auth.middleware`

### Frontend Conventions

#### Component Structure
```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export function ComponentName() {
  // hooks first
  // then derived state
  // then handlers
  // finally render
  
  return <div>...</div>;
}
```

#### State Management (Zustand)
```typescript
interface StoreState {
  items: Item[];
  setItems: (items: Item[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));
```

#### Form Handling
- Use `react-hook-form` with `zodResolver`
- Zod schemas in `@/lib/validations`
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<InputType>({
  resolver: zodResolver(schema),
});
```

#### Styling
- Use TailwindCSS classes
- Use `cn()` utility from `@/lib/utils` for class merging
- UI components in `@/components/ui/` use Radix UI primitives

#### API Calls
- Services in `@/services/`
- Typed responses using `ApiResponse<T>` from `@/lib/types`

---

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `task-hierarchy.routes.ts` |
| Variables | camelCase | `taskList`, `isLoading` |
| Functions | camelCase | `createTask`, `getUserById` |
| Types/Interfaces | PascalCase | `User`, `TaskResponse` |
| Enums | SCREAMING_SNAKE_CASE | `TaskStatus.BACKLOG` |
| Constants | camelCase or SCREAMING_SNAKE | `JWT_SECRET` or `maxRetries` |
| CSS Classes | kebab-case (Tailwind) | `text-primary`, `bg-background` |

---

## Error Handling

### Backend Errors
- Use Zod for request validation (returns 400)
- Return appropriate HTTP status codes:
  - 400: Validation error
  - 401: Authentication required
  - 403: Permission denied
  - 404: Resource not found
  - 409: Conflict (duplicate)
  - 500: Internal server error

### Frontend Errors
- Use try/catch with user-friendly toast messages
- Use `error.message` from caught errors for display

---

## Database (Prisma)

- Schema at `backend/prisma/schema.prisma`
- Run `npm run prisma:generate` after schema changes
- Use Prisma client from `@/utils/prisma` singleton

---

## Testing

### Backend Tests
- Location: `backend/src/__tests__/`
- Pattern: `*.test.ts`
- Use `supertest` for HTTP assertions
- Create test app inline for isolation

### Frontend Tests
- Location: `frontend/src/__tests__/`
- Pattern: `*.test.tsx`
- Use `@testing-library/react` and `@testing-library/user-event`
- Setup file: `frontend/src/__tests__/setup.ts`

### Running Specific Tests
```bash
# Backend
npm run test -- src/__tests__/task-api.test.ts

# Frontend
npm run test -- src/__tests__/components/MergeDialog.test.tsx
```

---

## API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;      // Error code (e.g., "VALIDATION_ERROR")
    message: string;   // Human-readable message
    details?: Record<string, string>;  // Field-specific errors
  };
}
```

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=
RATE_LIMIT_MAX=
```

### Frontend
Uses Vite - variables prefixed with `VITE_` in `.env`

---

## Key Dependencies

### Backend
- `express` - Web framework
- `prisma` + `@prisma/client` - ORM
- `zod` - Validation
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing
- `vitest` - Testing

### Frontend
- `react` 18 - UI library
- `react-router-dom` - Routing
- `zustand` - State management
- `@tanstack/react-query` - Data fetching (if used)
- `react-hook-form` + `@hookform/resolvers` + `zod` - Forms
- `tailwindcss` - Styling
- `@radix-ui/*` - Headless UI components
- `vitest` + `@testing-library/react` - Testing
