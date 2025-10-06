"use client";

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { TaskBoard } from "@/components/task-board";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";

export default function ProjectPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    currentProject,
    setCurrentProject,
    setProjects,
    setTasks,
    loading,
    error,
  } = useAppStore();

  const [projectLoaded, setProjectLoaded] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (isSignedIn && projectId && !projectLoaded && !loadingRef.current) {
      loadingRef.current = true;
      loadProject();
    }
  }, [isSignedIn, projectId, projectLoaded]);

  // Monitor for project deletion - redirect if current project no longer exists
  useEffect(() => {
    if (projectLoaded && currentProject && currentProject.id !== projectId) {
      // Project was deleted or changed, redirect to projects list
      router.push("/projects");
    }
  }, [currentProject, projectId, projectLoaded, router]);

  const loadProject = async () => {
    try {
      // Fetch projects using API client directly
      const projectsResponse = await apiClient.getProjects();
      if (!projectsResponse.success) {
        throw new Error(projectsResponse.error);
      }

      const projects = projectsResponse.data;
      if (projects) {
        setProjects(projects);

        const project = projects.find((p) => p.id === projectId);
        if (!project) {
          router.push("/");
          return;
        }

        setCurrentProject(project);

        // Fetch tasks using API client directly
        const tasksResponse = await apiClient.getTasks(projectId);
        if (tasksResponse.success && tasksResponse.data) {
          setTasks(tasksResponse.data);
        }

        setProjectLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      router.push("/");
    } finally {
      loadingRef.current = false;
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to landing page if not signed in
  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  // Show loading state while project is loading
  if (loading || !projectLoaded || !currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CollabTask
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-lg font-semibold text-gray-700">
                {currentProject.name}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Real-time</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <TaskBoard />
      </div>
    </div>
  );
}
