import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

// Wraps a component the way the real app does (main.jsx), minus AMSLayout
// (which access-gates on a fetch and returns null) and HealthProvider (SSE) —
// only include those explicitly in a test that needs them.
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ChakraProvider>,
  );
}
