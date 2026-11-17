import type {
  LoginRequest,
  OAuthCompleteRequest,
  OAuthProvider,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  RegisterRequest,
  RegisterResendRequest,
  RegisterVerifyRequest,
  User,
} from '@diplomacy/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../../api/client';
import {
  getAuthOAuthPending,
  getAuthOAuthProviders,
  getAuthUser,
  postAuthLogin,
  postAuthLogout,
  postAuthOAuthComplete,
  postAuthOAuthLogin,
  postAuthPasswordReset,
  postAuthPasswordResetVerify,
  postAuthRegister,
  postAuthRegisterResend,
  postAuthRegisterVerify,
} from './api';

export const sessionQueryKey = ['session'] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => getAuthUser(signal),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) => postAuthLogin(body),
    onSuccess: (user) => queryClient.setQueryData<User | null>(sessionQueryKey, user),
  });
}

/** 202 only: no session established until the user verifies via the emailed code. */
export function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterRequest) => postAuthRegister(body),
  });
}

export function useRegisterVerify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterVerifyRequest) => postAuthRegisterVerify(body),
    onSuccess: (user) => queryClient.setQueryData<User | null>(sessionQueryKey, user),
  });
}

export function useRegisterResend() {
  return useMutation({
    mutationFn: (body: RegisterResendRequest) => postAuthRegisterResend(body),
  });
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: (body: PasswordResetRequest) => postAuthPasswordReset(body),
  });
}

export function usePasswordResetVerify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PasswordResetVerifyRequest) => postAuthPasswordResetVerify(body),
    onSuccess: (user) => queryClient.setQueryData<User | null>(sessionQueryKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postAuthLogout,
    onSettled: () => queryClient.setQueryData<User | null>(sessionQueryKey, null),
  });
}

export function useOAuthProviders() {
  return useQuery({
    queryKey: ['auth', 'oauth', 'providers'],
    queryFn: ({ signal }) => getAuthOAuthProviders(signal),
    staleTime: Infinity,
  });
}

/** Navigates the whole page to the provider on success; it comes back via the backend callback. */
export function useOAuthLogin() {
  return useMutation({
    mutationFn: ({ provider, next }: { provider: OAuthProvider; next: string }) =>
      postAuthOAuthLogin(provider, next),
    onSuccess: (url) => window.location.assign(url),
  });
}

export function useOAuthPending() {
  return useQuery({
    queryKey: ['auth', 'oauth', 'pending'],
    queryFn: ({ signal }) => getAuthOAuthPending(signal),
    retry: false,
  });
}

export function useOAuthComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OAuthCompleteRequest) => postAuthOAuthComplete(body),
    onSuccess: (user) => queryClient.setQueryData<User | null>(sessionQueryKey, user),
  });
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled.',
  failed: "Couldn't complete sign-in with that provider. Please try again.",
  email_unverified:
    "That account's email address isn't verified by the provider, so we can't use it to sign in.",
  linked_elsewhere:
    'An account with this email is already linked to a different sign-in. Use that method instead.',
  rate_limited: 'Too many sign-in attempts. Please wait a few minutes and try again.',
  invite_only: "Sign-up is invite-only right now, and that account isn't on the list.",
};

/** Message for the `?oauthError=` the backend callback redirects with, or null. */
export function oauthErrorMessage(reason: string | null): string | null {
  if (!reason) {
    return null;
  }
  return Object.hasOwn(OAUTH_ERROR_MESSAGES, reason)
    ? (OAUTH_ERROR_MESSAGES[reason] ?? null)
    : (OAUTH_ERROR_MESSAGES.failed ?? null);
}

export function authErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (err.status === 401) {
    return 'Invalid credentials.';
  }
  if (err.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return err.detail || err.title || 'Something went wrong. Please try again.';
}
