import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getInitials } from "@/lib/utils";
import { LayoutDashboard, Settings, LogOut, Terminal, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { useState } from "react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "儀表板", icon: LayoutDashboard },
    { path: "/help", label: "說明", icon: HelpCircle },
    { path: "/settings", label: "設定", icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* 手機版頂部標題列 */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b bg-card z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <span className="font-bold">TaskManager</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Avatar className="h-8 w-8" onClick={() => navigate("/settings")}>
            <AvatarImage src={user?.avatarUrl?.startsWith("/") ? `${API_URL}${user.avatarUrl}` : user?.avatarUrl} />
            <AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : "?"}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* 桌面版側邊欄 */}
      <aside className={`hidden md:block fixed inset-y-0 left-0 z-50 ${collapsed ? "w-16" : "w-64"} border-r bg-card transition-all duration-300`}>
        <div className="flex h-16 items-center gap-2 border-b px-4 justify-between">
          {!collapsed && (
            <>
              <Terminal className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold tracking-tight">TaskManager</h1>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "展開" : "收合"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={`${collapsed ? "justify-center px-0" : "justify-start gap-2"} w-full`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className={`absolute bottom-0 left-0 right-0 border-t bg-muted/30 p-4 ${collapsed ? "flex flex-col items-center" : ""}`}>
          <div className="mb-3">
            <ThemeToggle showLabel={!collapsed} className={`${collapsed ? "justify-center px-0 w-8" : "justify-start gap-2 w-full"}`} />
          </div>
          <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3"}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl?.startsWith("/") ? `${API_URL}${user.avatarUrl}` : user?.avatarUrl} />
              <AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : "?"}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "用戶"}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">@{user?.username || "user"}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleLogout}
              title="登出"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* 手機版底部導航列 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t bg-card z-50 flex items-center justify-around px-2 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="flex-1">
              <Button
                variant="ghost"
                className={`w-full h-14 flex flex-col gap-1 ${isActive(item.path) ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
        <Button
          variant="ghost"
          className="flex-1 h-14 flex flex-col gap-1 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs">登出</span>
        </Button>
      </nav>

      {/* 主內容區 */}
      <main className={`pt-14 pb-16 md:pt-0 md:pb-0 ${collapsed ? "md:pl-16" : "md:pl-64"} transition-all duration-300`}>
        <div className="container py-4 md:py-6 px-4 md:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
