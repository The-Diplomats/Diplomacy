import { setupWorker } from 'msw/browser';

import { getDefaultHandlers } from './handlers';

export const worker = setupWorker(...getDefaultHandlers());
