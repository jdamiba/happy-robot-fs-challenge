"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { useWebSocket } from "@/lib/use-websocket";
import { ProjectList } from "@/components/project-list";
import { Users, Zap } from "lucide-react";

export default function ProjectsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { setProjects } = useAppStore();

  // Initialize WebSocket connection for global updates
  useWebSocket();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    } else if (isSignedIn) {
      // Load projects using API client directly
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
    }
  }, [isLoaded, isSignedIn, router, setProjects]);

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
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CollabTask
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Zap className="h-4 w-4 text-green-500" />
              <span>Real-time</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Welcome,{" "}
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ProjectList />
      </div>
    </div>
  );
}
