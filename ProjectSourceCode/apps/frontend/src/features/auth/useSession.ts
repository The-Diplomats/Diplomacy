import type {
  LoginRequest,
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
  getAuthUser,
  postAuthLogin,
  postAuthLogout,
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

export function authErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (err.status === 401) {
    return 'Invalid credentials.';
  }
  if (err.status === 403) {
    return 'Please verify your email before signing in.';
  }
  if (err.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return err.detail || err.title || 'Something went wrong. Please try again.';
}
