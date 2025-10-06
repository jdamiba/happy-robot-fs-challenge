import { PrismaClient } from "@prisma/client";
import {
  Project,
  Task,
  Comment,
  ParsedProject,
  ParsedTask,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateCommentInput,
  UpdateCommentInput,
} from "./types";
import {
  parseProject,
  parseTask,
  stringifyProjectData,
  stringifyTaskData,
  generateId,
} from "./utils";

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Project operations
export class ProjectService {
  static async create(data: CreateProjectInput): Promise<ParsedProject> {
    const projectData = stringifyProjectData(data);
    const project = await prisma.project.create({
      data: projectData,
    });
    return parseProject(project);
  }

  static async findById(id: string): Promise<ParsedProject | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            comments: true,
          },
        },
      },
    });
    return project ? parseProject(project) : null;
  }

  static async findAll(): Promise<ParsedProject[]> {
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(parseProject);
  }

  static async findByOwnerId(ownerId: string): Promise<ParsedProject[]> {
    const projects = await prisma.project.findMany({
      where: { ownerId },
      include: {
        tasks: {
          include: {
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(parseProject);
  }

  static async update(
    id: string,
    data: UpdateProjectInput
  ): Promise<ParsedProject> {
    const projectData = stringifyProjectData(data);
    const project = await prisma.project.update({
      where: { id },
      data: projectData,
      include: {
        tasks: {
          include: {
            comments: true,
          },
        },
      },
    });
    return parseProject(project);
  }

  static async delete(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  }
}

// Task operations
export class TaskService {
  static async create(data: CreateTaskInput): Promise<ParsedTask> {
    const taskData = stringifyTaskData(data);
    const task = await prisma.task.create({
      data: taskData,
      include: {
        project: true,
        comments: true,
      },
    });
    return parseTask(task);
  }

  static async findById(id: string): Promise<ParsedTask | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        comments: true,
      },
    });
    return task ? parseTask(task) : null;
  }

  static async findByProjectId(projectId: string): Promise<ParsedTask[]> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        project: true,
        comments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return tasks.map(parseTask);
  }

  static async update(id: string, data: UpdateTaskInput): Promise<ParsedTask> {
    const taskData = stringifyTaskData(data);

    const task = await prisma.task.update({
      where: { id },
      data: taskData,
      include: {
        project: true,
        comments: true,
      },
    });
    return parseTask(task);
  }

  static async delete(id: string): Promise<void> {
    await prisma.task.delete({
      where: { id },
    });
  }

  static async updateStatus(id: string, status: string): Promise<ParsedTask> {
    const task = await prisma.task.update({
      where: { id },
      data: { status: status as any },
      include: {
        project: true,
        comments: true,
      },
    });
    return parseTask(task);
  }

  static async addDependency(
    taskId: string,
    dependencyId: string
  ): Promise<ParsedTask> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error("Task not found");

    const dependencies = Array.isArray(task.dependencies)
      ? task.dependencies
      : [];
    if (!dependencies.includes(dependencyId)) {
      dependencies.push(dependencyId);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { dependencies },
      include: {
        project: true,
        comments: true,
      },
    });

    return parseTask(updatedTask);
  }

  static async removeDependency(
    taskId: string,
    dependencyId: string
  ): Promise<ParsedTask> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error("Task not found");

    const dependencies = Array.isArray(task.dependencies)
      ? task.dependencies
      : [];
    const filteredDependencies = dependencies.filter(
      (id: string) => id !== dependencyId
    );

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { dependencies: filteredDependencies },
      include: {
        project: true,
        comments: true,
      },
    });

    return parseTask(updatedTask);
  }
}

// Comment operations
export class CommentService {
  static async create(data: CreateCommentInput): Promise<Comment> {
    if (!data.authorId) {
      throw new Error("Author ID is required for comment creation");
    }

    const commentData = {
      id: generateId(),
      taskId: data.taskId,
      content: data.content,
      authorId: data.authorId,
      timestamp: new Date(),
    };

    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        task: true,
        author: true,
      },
    });
    return comment as Comment;
  }

  static async findById(id: string): Promise<Comment | null> {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        task: true,
        author: true,
      },
    });
    return comment as Comment | null;
  }

  static async findByTaskId(taskId: string): Promise<Comment[]> {
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        task: true,
        author: true,
      },
      orderBy: { timestamp: "asc" },
    });
    return comments as Comment[];
  }

  static async update(id: string, data: UpdateCommentInput): Promise<Comment> {
    const comment = await prisma.comment.update({
      where: { id },
      data,
      include: {
        task: true,
        author: true,
      },
    });
    return comment as Comment;
  }

  static async delete(id: string): Promise<void> {
    await prisma.comment.delete({
      where: { id },
    });
  }
}

// Transaction helpers for complex operations
export class TransactionService {
  static async createProjectWithTasks(
    projectData: CreateProjectInput,
    tasksData: CreateTaskInput[]
  ): Promise<{ project: ParsedProject; tasks: ParsedTask[] }> {
    return await prisma.$transaction(async (tx: any) => {
      // Create project
      const project = await tx.project.create({
        data: stringifyProjectData(projectData),
      });

      // Create tasks
      const tasks = await Promise.all(
        tasksData.map((taskData) =>
          tx.task.create({
            data: {
              ...stringifyTaskData(taskData),
              projectId: project.id,
            },
            include: {
              project: true,
              comments: true,
            },
          })
        )
      );

      return {
        project: parseProject(project),
        tasks: tasks.map(parseTask),
      };
    });
  }

  static async updateTaskWithDependencies(
    taskId: string,
    taskData: UpdateTaskInput,
    newDependencies: string[]
  ): Promise<ParsedTask> {
    return await prisma.$transaction(async (tx: any) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          ...stringifyTaskData(taskData),
          dependencies: newDependencies,
        },
        include: {
          project: true,
          comments: true,
        },
      });

      return parseTask(task);
    });
  }
}
