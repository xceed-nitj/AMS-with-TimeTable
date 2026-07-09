import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Chakra UI reads matchMedia during theme/color-mode resolution — jsdom has
// no real implementation, so components using ChakraProvider crash without this stub.
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom has no EventSource — only needed if a test renders HealthProvider.
if (!global.EventSource) {
  global.EventSource = class {
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Every attendance-module component/hook fetches on mount; give every test a
// safe default so an unmocked call fails loudly instead of hanging.
global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
);

afterEach(() => {
  vi.clearAllMocks();
});
