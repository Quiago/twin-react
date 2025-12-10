// src/__tests__/setup.js
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

// Extend Vitest's expect method with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock env variables
vi.stubEnv('VITE_NOTIFICATION_MOCK_MODE', 'true');
vi.stubEnv('VITE_EMAIL_SMTP_HOST', 'smtp.test.com');
vi.stubEnv('VITE_EMAIL_USERNAME', 'test@test.com');
