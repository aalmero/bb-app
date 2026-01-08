# Frontend Standards

### State Management
- use `useActionState` for form state management with async actions (React 19)
- use `useFormStatus` to access form submission status in child components (React 19)
- use `useTransition` to manage pending states for async operations
- separate concerns by using multiple `useEffect` hooks for different synchronization processes

### Data Fetching
- use custome hooks to encapsulate data fetching logic
- consider the `use` hook for sequential data fetching (future pattern)
- implement proper cleanup in `useEffect` for subscriptions and connections

### Component Patterns
- pass JSX as children instead of using factory for dynamic components
- extract list item logic into separate  components when using `useCallback`
- use context with custom hooks to avoid prop drilling
- keep components pure - avoid mutations of external variable during render

### Forms (React 19)
- use Action pattern with `useTransition` for automatic pending state management- leverage `useFormStatus` for submit button states
- handle errors with transition callback

### Code Quality
- ensure components are pure functions - same props should produce same output
- local mutations within render are acceptable (e.g. creatin and modifying local arrays)
- use `<Profiler>` component to measure rendering performance
- follow consistent response formats and error handling patterns


