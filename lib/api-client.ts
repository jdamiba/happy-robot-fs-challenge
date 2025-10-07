import {
  ParsedProject,
  ParsedTask,
  Comment,
  User,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateCommentInput,
  UpdateCommentInput,
  ApiResponse,
} from "./types";
import { useAppStore } from "./store";
import { generateOperationId } from "./utils";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // User operations
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>("/user/current");
  }

  // Project operations
  async getProjects(): Promise<ApiResponse<ParsedProject[]>> {
    return this.request<ParsedProject[]>("/projects");
  }

  async getProject(id: string): Promise<ApiResponse<ParsedProject>> {
    return this.request<ParsedProject>(`/projects/${id}`);
  }

  async createProject(
    data: CreateProjectInput
  ): Promise<ApiResponse<ParsedProject>> {
    return this.request<ParsedProject>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(
    id: string,
    data: UpdateProjectInput
  ): Promise<ApiResponse<ParsedProject>> {
    return this.request<ParsedProject>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Task operations
  async getTasks(projectId: string): Promise<ApiResponse<ParsedTask[]>> {
    return this.request<ParsedTask[]>(`/projects/${projectId}/tasks`);
  }

  async getTask(id: string): Promise<ApiResponse<ParsedTask>> {
    return this.request<ParsedTask>(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskInput): Promise<ApiResponse<ParsedTask>> {
    return this.request<ParsedTask>(`/projects/${data.projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTask(
    id: string,
    data: UpdateTaskInput
  ): Promise<ApiResponse<ParsedTask>> {
    return this.request<ParsedTask>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tasks/${id}`, {
      method: "DELETE",
    });
  }

  // Comment operations
  async getComments(taskId: string): Promise<ApiResponse<Comment[]>> {
    return this.request<Comment[]>(`/tasks/${taskId}/comments`);
  }

  async getComment(id: string): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/comments/${id}`);
  }

  async createComment(data: CreateCommentInput): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/tasks/${data.taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateComment(
    id: string,
    data: UpdateCommentInput
  ): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/comments/${id}`, {
      method: "DELETE",
    });
  }
}

// Optimistic API client with rollback capability
export class OptimisticApiClient extends ApiClient {
  private store = useAppStore.getState();

  // Project operations with optimistic updates
  async createProjectOptimistic(data: CreateProjectInput): Promise<string> {
    const operationId = this.store.createProjectOptimistic({
      ...data,
      tasks: [],
    });

    try {
      const response = await this.createProject(data);

      if (response.success && response.data) {
        // Replace optimistic project with real one
        this.store.setProjects(
          this.store.projects.map((p) =>
            p.id === `temp-${operationId}` ? response.data! : p
          )
        );
      } else {
        // Rollback on failure
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to create project");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  async updateProjectOptimistic(
    id: string,
    data: UpdateProjectInput
  ): Promise<string> {
    const operationId = generateOperationId();
    this.store.updateProjectOptimistic(id, data);

    try {
      const response = await this.updateProject(id, data);

      if (!response.success) {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to update project");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  async deleteProjectOptimistic(id: string): Promise<string> {
    const operationId = generateOperationId();
    this.store.deleteProjectOptimistic(id);

    try {
      const response = await this.deleteProject(id);

      if (!response.success) {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to delete project");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  // Task operations with optimistic updates
  async createTaskOptimistic(data: CreateTaskInput): Promise<string> {
    const operationId = this.store.createTaskOptimistic({
      ...data,
      project: undefined,
      comments: [],
    });

    try {
      const response = await this.createTask(data);

      if (response.success && response.data) {
        // Replace optimistic task with real one
        this.store.setTasks(
          this.store.tasks.map((t) =>
            t.id === `temp-${operationId}` ? response.data! : t
          )
        );
      } else {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to create task");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  async updateTaskOptimistic(
    id: string,
    data: UpdateTaskInput
  ): Promise<string> {
    const operationId = generateOperationId();
    this.store.updateTaskOptimistic(id, data as Partial<ParsedTask>);

    try {
      const response = await this.updateTask(id, data);

      if (!response.success) {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to update task");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  async deleteTaskOptimistic(id: string): Promise<string> {
    const operationId = generateOperationId();
    this.store.deleteTaskOptimistic(id);

    try {
      const response = await this.deleteTask(id);

      if (!response.success) {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to delete task");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  // Comment operations with optimistic updates
  async createCommentOptimistic(data: CreateCommentInput): Promise<string> {
    if (!data.authorId) {
      throw new Error("Author ID is required for comment creation");
    }

    const operationId = this.store.createCommentOptimistic({
      ...data,
      authorId: data.authorId,
      task: undefined,
    });

    try {
      const response = await this.createComment(data);

      if (response.success && response.data) {
        // Replace optimistic comment with real one
        const taskId = data.taskId;
        const comments = this.store.comments[taskId] || [];
        this.store.setComments(
          taskId,
          comments.map((c) =>
            c.id === `temp-${operationId}` ? response.data! : c
          )
        );
      } else {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to create comment");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  async updateCommentOptimistic(
    id: string,
    data: UpdateCommentInput
  ): Promise<string> {
    const operationId = generateOperationId();
    this.store.updateCommentOptimistic(id, data);

    try {
      const response = await this.updateComment(id, data);

      if (!response.success) {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to update comment");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }

  async deleteCommentOptimistic(id: string): Promise<string> {
    const operationId = generateOperationId();
    this.store.deleteCommentOptimistic(id);

    try {
      const response = await this.deleteComment(id);

      if (!response.success) {
        this.store.rollbackOperation(operationId);
        throw new Error(response.error || "Failed to delete comment");
      }
    } catch (error) {
      this.store.rollbackOperation(operationId);
      throw error;
    }

    return operationId;
  }
}

// Export singleton instances
export const apiClient = new ApiClient();
export const optimisticApiClient = new OptimisticApiClient();
