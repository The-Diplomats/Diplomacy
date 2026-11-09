import type { getAuthMe, ProblemDetails } from '@diplomacy/contracts';

// Derived from a generated client fn so this file doesn't depend on Kubb.
type Client = NonNullable<NonNullable<Parameters<typeof getAuthMe>[0]>['client']>;

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly title?: string;
  readonly detail?: string;

  constructor(status: number, problem?: Partial<ProblemDetails>) {
    super(problem?.detail ?? problem?.title ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.title = problem?.title;
    this.detail = problem?.detail;
  }
}

/**
 * Fetch adapter for the generated Kubb client. Prefixes VITE_API_URL, sends
 * JSON, includes the session cookie, and throws ApiError on non-2xx.
 */
export const apiClient: Client = async (config) => {
  const headers = new Headers(config.headers);
  const hasBody = config.data !== undefined;
  if (hasBody) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${config.baseURL ?? BASE_URL}${config.url ?? ''}`, {
    method: config.method,
    credentials: 'include',
    headers,
    body: hasBody ? JSON.stringify(config.data) : undefined,
    signal: config.signal,
  });

  const body: unknown =
    response.status === 204 || response.status === 202
      ? undefined
      : await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(response.status, body as Partial<ProblemDetails> | undefined);
  }

  return {
    data: body as never,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};
