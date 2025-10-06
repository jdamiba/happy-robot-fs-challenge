# Test Suite Documentation

## Overview

This project includes a comprehensive test suite covering:

1. **CRUD operations on projects**
2. **CRUD operations on tasks**
3. **Real-time WebSocket features**
4. **React component interactions**
5. **Database service layer**

## Test Structure

```
__tests__/
├── api/                    # API route tests
│   ├── projects.test.ts    # Project CRUD operations
│   ├── tasks.test.ts       # Task CRUD operations
│   └── basic.test.ts       # Basic API utilities
├── components/             # React component tests
│   └── task-board.test.tsx # TaskBoard component
├── lib/                    # Library/utility tests
│   ├── websocket.test.ts   # WebSocket functionality
│   ├── store.test.ts       # Zustand store
│   └── db.test.ts          # Database operations
├── integration/            # Integration tests
│   └── realtime.test.ts    # End-to-end real-time flow
└── summary.test.ts         # Test coverage overview
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Files

```bash
npm test __tests__/api/projects.test.ts
npm test __tests__/components/task-board.test.tsx
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

## Test Categories

### 1. API Route Tests

Tests for Next.js API routes covering:

- **Projects API** (`/api/projects`)

  - GET: Fetch user's projects
  - POST: Create new project
  - PUT: Update existing project
  - DELETE: Remove project

- **Tasks API** (`/api/projects/[id]/tasks`, `/api/tasks/[id]`)
  - GET: Fetch project tasks
  - POST: Create new task
  - PUT: Update existing task
  - DELETE: Remove task

### 2. Component Tests

React component tests using React Testing Library:

- **TaskBoard Component**
  - Renders project information
  - Displays tasks in correct columns
  - Handles task creation
  - Shows task details modal
  - Updates task status
  - Displays active users

### 3. WebSocket Tests

Real-time functionality tests:

- **Connection Management**

  - WebSocket connection establishment
  - User ID setting
  - Project room joining/leaving
  - Connection recovery

- **Message Broadcasting**
  - Task updates (create, update, delete)
  - Comment operations (create, update, delete)
  - Project updates
  - User presence updates

### 4. Database Tests

Service layer tests for database operations:

- **ProjectService**

  - Create, read, update, delete projects
  - Find projects by owner
  - Handle project relationships

- **TaskService**

  - CRUD operations for tasks
  - Status updates
  - Dependency management
  - Project relationships

- **CommentService**
  - CRUD operations for comments
  - Task relationships
  - Author relationships

### 5. Integration Tests

End-to-end real-time flow tests:

- **User Presence Flow**

  - User joins project
  - Presence broadcasting
  - Active user list updates

- **Real-time Collaboration**
  - Task updates across clients
  - Comment synchronization
  - Project changes propagation

## Mocking Strategy

### External Dependencies

- **Prisma**: Mocked database operations
- **Clerk**: Mocked authentication
- **WebSocket**: Mocked real-time connections
- **Next.js Router**: Mocked navigation

### Test Data

- Consistent mock data across tests
- Realistic user scenarios
- Edge case handling

## Test Configuration

### Jest Setup (`jest.config.js`)

- Next.js integration with `next/jest`
- TypeScript support
- Path mapping (`@/` aliases)
- Coverage collection
- JSX transformation

### Test Environment (`jest.setup.js`)

- React Testing Library setup
- Global mocks and polyfills
- Web API polyfills (Request, Response)
- Console error suppression

## Coverage Goals

Target coverage areas:

- **API Routes**: 90%+ line coverage
- **Components**: 85%+ line coverage
- **WebSocket Logic**: 90%+ line coverage
- **Database Services**: 95%+ line coverage
- **Integration Flows**: 80%+ scenario coverage

## Best Practices

### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Mocking

- Mock external dependencies
- Use realistic test data
- Avoid over-mocking

### Assertions

- Test behavior, not implementation
- Use appropriate matchers
- Include edge cases

### Async Testing

- Use `waitFor` for async operations
- Properly handle promises
- Test error scenarios

## Continuous Integration

Tests run automatically on:

- Pull request creation
- Push to main branch
- Manual trigger

Required for merge:

- All tests passing
- Minimum coverage thresholds met
- No linting errors

## Debugging Tests

### Common Issues

1. **Module Resolution**: Check path mapping configuration
2. **Async Operations**: Ensure proper await/async handling
3. **Mock Setup**: Verify mock implementations
4. **Environment**: Check Jest environment setup

### Debug Commands

```bash
# Run specific test with verbose output
npm test -- --verbose __tests__/api/projects.test.ts

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Check test coverage
npm run test:coverage
```

## Future Enhancements

### Planned Additions

- **E2E Tests**: Cypress integration tests
- **Performance Tests**: Load testing for WebSocket
- **Visual Tests**: Component visual regression
- **Accessibility Tests**: A11y compliance testing

### Test Utilities

- Custom test helpers
- Shared mock data
- Test data factories
- Integration test helpers
