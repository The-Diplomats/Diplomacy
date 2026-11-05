import { setupServer } from 'msw/node';

import { getDefaultHandlers } from './handlers';

export const server = setupServer(...getDefaultHandlers());
