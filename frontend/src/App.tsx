import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Layout } from "@/components/layout/Layout";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { ProjectBoard } from "@/pages/ProjectBoard";
import { Profile } from "@/pages/Profile";
import { Help } from "@/pages/Help";
import { InvitePage } from "@/pages/Invite";
import { ApiTest } from "@/pages/ApiTest";
import { Toaster } from "@/components/ui/toaster";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="projects/:id" element={<ProjectBoard />} />
          <Route path="settings" element={<Profile />} />
          <Route path="help" element={<Help />} />
          <Route path="join/:token" element={<InvitePage />} />
        </Route>
        <Route path="/api-test" element={<ApiTest />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
