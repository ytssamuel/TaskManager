import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
}

interface Project {
  id: string;
  name: string;
  _count: { tasks: number };
}

export function TaskSummary({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get<ApiResponse<TaskSummary>>(
          `/projects/${projectId}/tasks/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setSummary(response.data.data || null);
        }
      } catch (error) {
        console.error("Failed to load summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [projectId]);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!summary) return null;

  const stats = [
    { label: "總任務", value: summary.total, color: "text-foreground" },
    { label: "已完成", value: summary.completed, color: "text-green-500" },
    { label: "進行中", value: summary.inProgress, color: "text-blue-500" },
    { label: "待辦", value: summary.todo, color: "text-yellow-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center p-3 bg-muted rounded-lg">
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSummary() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get<ApiResponse<Project[]>>(
          "/projects",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setProjects(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">您的專案</h2>
      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          尚無專案
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskSummary projectId={project.id} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
