import type { Message } from '@diplomacy/contracts';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { createGameSocket } from '../../api/socket';
import { useSession } from '../auth/useSession';
import { getGameMessages, postGameMessage } from './api';

export function gameMessagesQueryKey(gameId: string) {
  return ['games', gameId, 'messages'] as const;
}

function addMessage(queryClient: QueryClient, gameId: string, message: Message): void {
  queryClient.setQueryData<Message[]>(gameMessagesQueryKey(gameId), (current = []) =>
    current.some((existing) => existing.id === message.id) ? current : [...current, message],
  );
}

export function useGameMessages(gameId: string) {
  return useQuery({
    queryKey: gameMessagesQueryKey(gameId),
    queryFn: ({ signal }) => getGameMessages(gameId, signal),
  });
}

export function useSendMessage(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => postGameMessage(gameId, text),
    onSuccess: (message) => addMessage(queryClient, gameId, message),
  });
}

export function useLiveGameMessages(gameId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = createGameSocket();

    socket.on('connect', () => {
      socket.emit('game:join', { gameId }, (result) => {
        if (result.ok) {
          void queryClient.invalidateQueries({ queryKey: gameMessagesQueryKey(gameId) });
        }
      });
    });

    socket.on('message:new', (message) => addMessage(queryClient, gameId, message));

    return () => {
      socket.disconnect();
    };
  }, [gameId, queryClient]);
}

function lastReadKey(gameId: string): string {
  return `chat:lastReadAt:${gameId}`;
}

function loadLastReadAt(gameId: string): string | null {
  try {
    return localStorage.getItem(lastReadKey(gameId));
  } catch {
    return null;
  }
}

function saveLastReadAt(gameId: string, createdAt: string): void {
  try {
    localStorage.setItem(lastReadKey(gameId), createdAt);
  } catch {
    /* If it can't save to local storage for some reason, then the unread feature just won't work */
  }
}

export function useUnreadMessages(gameId: string, chatOpen: boolean) {
  const { data: messages = [] } = useGameMessages(gameId);
  const { data: session } = useSession();
  const [lastReadAt, setLastReadAt] = useState(() => loadLastReadAt(gameId));

  function markRead(): void {
    const newest = messages.at(-1)?.createdAt;
    if (!newest) {
      return;
    }
    setLastReadAt(newest);
    saveLastReadAt(gameId, newest);
  }

  const unread = chatOpen
    ? 0
    : messages.filter(
        (message) =>
          message.fromUsername !== session?.username &&
          (lastReadAt === null || message.createdAt > lastReadAt),
      ).length;

  return { unread, markRead };
}
