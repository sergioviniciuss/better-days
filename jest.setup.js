import '@testing-library/jest-dom'

// Mock React.cache for server components in tests
// React.cache is not available in Jest environment, so we mock it as an identity function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (fn) => fn,
}))
