import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getGameMessages, postGameMessage } from './api';

export function gameMessagesQueryKey(gameId: string) {
  return ['games', gameId, 'messages'] as const;
}

export function useGameMessages(gameId: string) {
  /* Temporary until Socket.IO implementation later */
  return useQuery({
    queryKey: gameMessagesQueryKey(gameId),
    queryFn: ({ signal }) => getGameMessages(gameId, signal),
    refetchInterval: 3000,
  });
}

export function useSendMessage(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => postGameMessage(gameId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameMessagesQueryKey(gameId) }),
  });
}
