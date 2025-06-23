
import '@testing-library/jest-dom';

// Configuration globale pour les tests
// Mock des APIs du navigateur si nécessaire
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substr(2, 9)
  }
});

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
