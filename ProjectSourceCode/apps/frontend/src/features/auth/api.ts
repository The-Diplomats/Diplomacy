import {
  getAuthMe,
  getAuthOAuthPending as getAuthOAuthPendingRequest,
  getAuthOAuthProviders as getAuthOAuthProvidersRequest,
  type LoginRequest,
  type OAuthCompleteRequest,
  type OAuthPendingSignup,
  type OAuthProvider,
  type PasswordResetRequest,
  type PasswordResetVerifyRequest,
  postAuthLogin as postAuthLoginRequest,
  postAuthLogout as postAuthLogoutRequest,
  postAuthOAuthComplete as postAuthOAuthCompleteRequest,
  postAuthPasswordReset as postAuthPasswordResetRequest,
  postAuthPasswordResetVerify as postAuthPasswordResetVerifyRequest,
  postAuthRegister as postAuthRegisterRequest,
  postAuthRegisterResend as postAuthRegisterResendRequest,
  postAuthRegisterVerify as postAuthRegisterVerifyRequest,
  postGoogleOAuthLogin,
  postMicrosoftOAuthLogin,
  type RegisterRequest,
  type RegisterResendRequest,
  type RegisterVerifyRequest,
  type User,
} from '@diplomacy/contracts';

import { apiClient, ApiError } from '../../api/client';

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

/** 202; no body. Follow up with /auth/register/verify once the user has the code. */
export async function postAuthRegister(body: RegisterRequest): Promise<void> {
  await postAuthRegisterRequest(body, { client: apiClient });
}

export function postAuthRegisterVerify(body: RegisterVerifyRequest): Promise<User> {
  return postAuthRegisterVerifyRequest(body, { client: apiClient });
}

export async function postAuthRegisterResend(body: RegisterResendRequest): Promise<void> {
  await postAuthRegisterResendRequest(body, { client: apiClient });
}

export async function postAuthPasswordReset(body: PasswordResetRequest): Promise<void> {
  await postAuthPasswordResetRequest(body, { client: apiClient });
}

export function postAuthPasswordResetVerify(body: PasswordResetVerifyRequest): Promise<User> {
  return postAuthPasswordResetVerifyRequest(body, { client: apiClient });
}

export async function postAuthLogout(): Promise<void> {
  await postAuthLogoutRequest({ client: apiClient });
}

export async function getAuthOAuthProviders(signal?: AbortSignal): Promise<OAuthProvider[]> {
  const { providers } = await getAuthOAuthProvidersRequest({ client: apiClient, signal });
  return providers;
}

const oauthLoginRequests = {
  google: postGoogleOAuthLogin,
  microsoft: postMicrosoftOAuthLogin,
} satisfies Record<OAuthProvider, unknown>;

/** Returns the provider authorization URL; the caller navigates the browser there. */
export async function postAuthOAuthLogin(provider: OAuthProvider, next: string): Promise<string> {
  const { url } = await oauthLoginRequests[provider]({ next }, { client: apiClient });
  return url;
}

export async function getAuthOAuthPending(
  signal?: AbortSignal,
): Promise<OAuthPendingSignup | null> {
  try {
    return await getAuthOAuthPendingRequest({ client: apiClient, signal });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export function postAuthOAuthComplete(body: OAuthCompleteRequest): Promise<User> {
  return postAuthOAuthCompleteRequest(body, { client: apiClient });
}
