import type { Message, Player, User } from '@diplomacy/contracts';
import {
  type QueryClient,
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { createGameSocket } from '../../api/socket';
import { sessionQueryKey, useSession } from '../auth/useSession';
import { getDmThread, getGameMessages, getGamePlayers, postDm, postGameMessage } from './api';

export function gameMessagesQueryKey(gameId: string) {
  return ['games', gameId, 'messages'] as const;
}

export function dmThreadQueryKey(gameId: string, participantId: string) {
  return ['games', gameId, 'messages', 'dm', participantId] as const;
}

export function gamePlayersQueryKey(gameId: string) {
  return ['games', gameId, 'players'] as const;
}

function appendMessage(queryClient: QueryClient, queryKey: QueryKey, message: Message): void {
  queryClient.setQueryData<Message[]>(queryKey, (current = []) =>
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
    onSuccess: (message) => appendMessage(queryClient, gameMessagesQueryKey(gameId), message),
  });
}

function myPlayerIdFromCache(queryClient: QueryClient, gameId: string): string | undefined {
  const session = queryClient.getQueryData<User | null>(sessionQueryKey);
  const players = queryClient.getQueryData<Player[]>(gamePlayersQueryKey(gameId));
  return players?.find((player) => player.userId === session?.id)?.id;
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

    socket.on('message:new', (message) =>
      appendMessage(queryClient, gameMessagesQueryKey(gameId), message),
    );

    socket.on('message:dm', (message) => {
      const myPlayerId = myPlayerIdFromCache(queryClient, gameId);
      if (!myPlayerId) {
        void queryClient.invalidateQueries({ queryKey: [...gameMessagesQueryKey(gameId), 'dm'] });
        return;
      }
      const otherPlayerId =
        message.fromPlayerId === myPlayerId ? message.toPlayerId : message.fromPlayerId;
      if (otherPlayerId) {
        appendMessage(queryClient, dmThreadQueryKey(gameId, otherPlayerId), message);
      }
    });

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

export function useGamePlayers(gameId: string) {
  return useQuery({
    queryKey: gamePlayersQueryKey(gameId),
    queryFn: ({ signal }) => getGamePlayers(gameId, signal),
  });
}

export function useMyPlayer(gameId: string): Player | undefined {
  const { data: players = [] } = useGamePlayers(gameId);
  const { data: session } = useSession();
  return players.find((player) => player.userId === session?.id);
}

export function useDmThread(gameId: string, participantId: string | null) {
  return useQuery({
    queryKey: dmThreadQueryKey(gameId, participantId ?? ''),
    queryFn: ({ signal }) => getDmThread(gameId, participantId ?? '', signal),
    enabled: participantId !== null,
  });
}

export function useSendDm(gameId: string, participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => postDm(gameId, participantId, text),
    onSuccess: (message) =>
      appendMessage(queryClient, dmThreadQueryKey(gameId, participantId), message),
  });
}
