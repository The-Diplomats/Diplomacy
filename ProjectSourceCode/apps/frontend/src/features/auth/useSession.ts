import type { LoginRequest, RegisterRequest, User } from '@diplomacy/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ApiError,
  getAuthUser,
  postAuthLogin,
  postAuthLogout,
  postAuthRegister,
} from '../../api/client';

export const sessionQueryKey = ['session'] as const;

/** The signed-in user (`null` when signed out), restored from the session cookie. */
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

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterRequest) => postAuthRegister(body),
    onSuccess: (user) => queryClient.setQueryData<User | null>(sessionQueryKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postAuthLogout,
    // The session may already be gone server-side; clear local state regardless.
    onSettled: () => queryClient.setQueryData<User | null>(sessionQueryKey, null),
  });
}

/** Form-level message for a failed auth request (field-specific cases are handled by callers). */
export function authErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (err.status === 401) {
    return 'Incorrect email or password.';
  }
  if (err.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return err.detail || err.title || 'Something went wrong. Please try again.';
}
