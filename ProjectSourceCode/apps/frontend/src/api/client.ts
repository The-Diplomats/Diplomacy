import {
  getAuthMe,
  type LoginRequest,
  postAuthLogin as postAuthLoginRequest,
  postAuthLogout as postAuthLogoutRequest,
  postAuthRegister as postAuthRegisterRequest,
  type ProblemDetails,
  type RegisterRequest,
  type User,
} from '@diplomacy/contracts';

// The generated client functions accept a pluggable `client`; derive its type
// from them so the frontend doesn't need a direct dep on @kubb/plugin-client.
type Client = NonNullable<NonNullable<Parameters<typeof getAuthMe>[0]>['client']>;

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Thrown for any non-2xx response; carries the RFC 7807 problem body when present. */
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
 * Fetch adapter for the generated Kubb client. Unlike Kubb's default fetch
 * client it prefixes VITE_API_URL, sends JSON with a Content-Type header,
 * includes the session cookie, and throws ApiError on non-2xx responses.
 */
const apiClient: Client = async (config) => {
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
    response.status === 204 ? undefined : await response.json().catch(() => undefined);

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

/** Current session user, or null when not signed in. */
export async function getAuthUser(signal?: AbortSignal): Promise<User | null> {
  try {
    return await getAuthMe({ client: apiClient, signal });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

export function postAuthLogin(body: LoginRequest): Promise<User> {
  return postAuthLoginRequest(body, { client: apiClient });
}

export function postAuthRegister(body: RegisterRequest): Promise<User> {
  return postAuthRegisterRequest(body, { client: apiClient });
}

export async function postAuthLogout(): Promise<void> {
  await postAuthLogoutRequest({ client: apiClient });
}
