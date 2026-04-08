import { vi } from "vitest";

export const { toastMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => {
  return {
    toast: (...args: any[]) => toastMock(...args),
    useToast: () => ({
      toast: (...args: any[]) => toastMock(...args),
      dismiss: vi.fn(),
      toasts: [],
    }),
  };
});
