import type { Message } from '@diplomacy/contracts';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { createGameSocket } from '../../api/socket';
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
