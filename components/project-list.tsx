"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FolderOpen, Users, Calendar, Trash2 } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

export function ProjectList() {
  const { user } = useUser();
  const router = useRouter();
  const { projects, setProjects, setLoading, setError } = useAppStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await apiClient.getProjects();
        if (response.success && response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      }
    };
    loadProjects();
  }, [setProjects]); // Only depend on setProjects which is stable

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim() || !user) return;

    setLoading(true);
    try {
      const response = await apiClient.createProject({
        ...newProject,
        ownerId: user.id, // Use Clerk user ID
      });
      if (response.success && response.data) {
        setProjects([response.data, ...projects]);
        setNewProject({ name: "", description: "" });
        setShowCreateForm(false);
      } else {
        setError(response.error || "Failed to create project");
      }
    } catch (error) {
      setError("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: any) => {
    router.push(`/projects/${project.id}`);
  };

  const handleDeleteProject = async (project: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    // Check if project has tasks
    if (project.tasks && project.tasks.length > 0) {
      const confirmed = window.confirm(
        `This project has ${project.tasks.length} task(s). Deleting it will also delete all associated tasks. Are you sure you want to delete "${project.name}"?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const response = await apiClient.deleteProject(project.id);

      if (response.success) {
        // Remove project from local state
        setProjects(projects.filter((p: any) => p.id !== project.id));
      } else {
        console.error("Failed to delete project:", response.error);
        setError(response.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      setError("Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your collaborative task management projects
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Start a new collaborative project</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Project Name
                </label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Project</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleSelectProject(project)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleDeleteProject(project, e)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {project.description && (
                <CardDescription>{project.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{project.tasks?.length || 0} tasks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatTimestamp(project.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first project to start managing tasks collaboratively
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
