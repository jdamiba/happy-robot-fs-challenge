import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskBoard } from "@/components/task-board";
import { useAppStore } from "@/lib/store";

// Mock the Zustand store
jest.mock("@/lib/store", () => ({
  useAppStore: jest.fn(),
}));

// Mock the WebSocket hook
jest.mock("@/lib/use-websocket", () => ({
  useWebSocket: () => ({
    joinProject: jest.fn(),
    leaveProject: jest.fn(),
  }),
}));

// Mock API client
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    getCurrentUser: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: "user_123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    }),
    getTasks: jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: "task_1",
          title: "Test Task",
          description: "Test Description",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project_1",
          authorId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          dependencies: [],
          tags: [],
          configuration: {},
        },
      ],
    }),
    createTask: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: "task_new",
        title: "New Task",
        description: "New Description",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
      },
    }),
    updateTask: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: "task_1",
        title: "Updated Task",
        description: "Updated Description",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
      },
    }),
    deleteTask: jest.fn().mockResolvedValue({
      success: true,
    }),
  },
}));

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

describe("TaskBoard", () => {
  const mockStore = {
    currentProject: {
      id: "project_1",
      name: "Test Project",
      description: "Test Description",
      ownerId: "user_123",
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
    },
    tasks: [
      {
        id: "task_1",
        title: "Test Task",
        description: "Test Description",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
      },
    ],
    activeUsers: [
      {
        userId: "user_123",
        clientId: "client_123",
        joinedAt: Date.now(),
        initials: "TU",
      },
    ],
    setTasks: jest.fn(),
    setCurrentProject: jest.fn(),
    setError: jest.fn(),
    setLoading: jest.fn(),
    wsConnected: true,
  };

  beforeEach(() => {
    mockUseAppStore.mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it("should render project information", () => {
    render(<TaskBoard />);

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("should render tasks in correct columns", () => {
    render(<TaskBoard />);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("should render active users", () => {
    render(<TaskBoard />);

    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
    expect(screen.getByText("TU")).toBeInTheDocument();
  });

  it("should show create task form when button is clicked", async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    const createButton = screen.getByText("Create New Task");
    await user.click(createButton);

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
  });

  it("should create a new task", async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    // Open create form
    const createButton = screen.getByText("Create New Task");
    await user.click(createButton);

    // Fill form
    await user.type(screen.getByLabelText("Title"), "New Task");
    await user.type(screen.getByLabelText("Description"), "New Description");
    await user.selectOptions(screen.getByLabelText("Priority"), "HIGH");

    // Submit form
    const submitButton = screen.getByText("Create Task");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockStore.setTasks).toHaveBeenCalled();
    });
  });

  it("should open task detail modal when task is clicked", async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    const taskCard = screen.getByText("Test Task");
    await user.click(taskCard);

    expect(screen.getByText("Task Details")).toBeInTheDocument();
  });

  it("should update task status when dropdown is changed", async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    // Find and click the status dropdown
    const statusDropdown = screen.getByDisplayValue("TODO");
    await user.selectOptions(statusDropdown, "IN_PROGRESS");

    await waitFor(() => {
      expect(mockStore.setTasks).toHaveBeenCalled();
    });
  });

  it("should show loading state", () => {
    mockUseAppStore.mockReturnValue({
      ...mockStore,
      loading: true,
    });

    render(<TaskBoard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should show error state", () => {
    mockUseAppStore.mockReturnValue({
      ...mockStore,
      error: "Something went wrong",
    });

    render(<TaskBoard />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should handle empty tasks state", () => {
    mockUseAppStore.mockReturnValue({
      ...mockStore,
      tasks: [],
    });

    render(<TaskBoard />);

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first task to get started!")
    ).toBeInTheDocument();
  });

  it("should handle task with dependencies", () => {
    const taskWithDependencies = {
      ...mockStore.tasks[0],
      dependencies: ["task_2"],
    };

    mockUseAppStore.mockReturnValue({
      ...mockStore,
      tasks: [taskWithDependencies],
    });

    render(<TaskBoard />);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    // Should show dependency indicator
    expect(screen.getByTestId("dependency-indicator")).toBeInTheDocument();
  });

  it("should filter tasks by status", () => {
    const tasksWithDifferentStatuses = [
      {
        ...mockStore.tasks[0],
        id: "task_1",
        status: "TODO",
      },
      {
        ...mockStore.tasks[0],
        id: "task_2",
        status: "IN_PROGRESS",
      },
      {
        ...mockStore.tasks[0],
        id: "task_3",
        status: "DONE",
      },
    ];

    mockUseAppStore.mockReturnValue({
      ...mockStore,
      tasks: tasksWithDifferentStatuses,
    });

    render(<TaskBoard />);

    // Check that tasks are in correct columns
    expect(screen.getByText("TODO (1)")).toBeInTheDocument();
    expect(screen.getByText("IN PROGRESS (1)")).toBeInTheDocument();
    expect(screen.getByText("DONE (1)")).toBeInTheDocument();
  });
});
