import type { Message, Player, User } from '@diplomacy/contracts';
import {
  type QueryClient,
  type QueryKey,
  useMutation,
  useQueries,
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

export function useSendDm(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, text }: { participantId: string; text: string }) =>
      postDm(gameId, participantId, text),
    onSuccess: (message, { participantId }) =>
      appendMessage(queryClient, dmThreadQueryKey(gameId, participantId), message),
  });
}

export function conversationKey(participantId: string | null): string {
  return participantId ?? 'public';
}

type ReadMarkers = Record<string, string>;

function readMarkersKey(playerId: string): string {
  return `chat:readMarkers:${playerId}`;
}

function loadReadMarkers(playerId: string): ReadMarkers {
  try {
    const raw = localStorage.getItem(readMarkersKey(playerId));
    return raw ? (JSON.parse(raw) as ReadMarkers) : {};
  } catch {
    return {};
  }
}

function saveReadMarkers(playerId: string, markers: ReadMarkers): void {
  try {
    localStorage.setItem(readMarkersKey(playerId), JSON.stringify(markers));
  } catch {
    // Don't save
  }
}

function countUnread(
  messages: Message[],
  lastReadAt: string | undefined,
  myPlayerId: string | undefined,
): number {
  return messages.filter(
    (message) =>
      message.fromPlayerId !== myPlayerId &&
      (lastReadAt === undefined || message.createdAt > lastReadAt),
  ).length;
}

/** Unread counts for each conversation and in total
 * activeParticipantId is the conversation currently open (null if public conversation, undefined if no conversation is open)
 */
export function useUnreadCounts(gameId: string, activeParticipantId: string | null | undefined) {
  const { data: players = [] } = useGamePlayers(gameId);
  const myPlayer = useMyPlayer(gameId);
  const { data: publicMessages = [] } = useGameMessages(gameId);
  const others = players.filter((player) => player.id !== myPlayer?.id);

  const dmThreads = useQueries({
    queries: others.map((player) => ({
      queryKey: dmThreadQueryKey(gameId, player.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getDmThread(gameId, player.id, signal),
    })),
  });

  const [loaded, setLoaded] = useState<{ playerId: string | undefined; markers: ReadMarkers }>({
    playerId: undefined,
    markers: {},
  });
  if (loaded.playerId !== myPlayer?.id) {
    setLoaded({ playerId: myPlayer?.id, markers: myPlayer ? loadReadMarkers(myPlayer.id) : {} });
  }
  const markers = loaded.markers;

  const threads = [
    { participantId: null as string | null, messages: publicMessages },
    ...others.map((player, index) => ({
      participantId: player.id as string | null,
      messages: dmThreads[index]?.data ?? [],
    })),
  ];

  const byConversation: Record<string, number> = {};
  let total = 0;
  for (const { participantId, messages } of threads) {
    const key = conversationKey(participantId);
    const count =
      participantId === activeParticipantId ? 0 : countUnread(messages, markers[key], myPlayer?.id);
    byConversation[key] = count;
    total += count;
  }

  function markRead(participantId: string | null): void {
    const thread = threads.find((t) => t.participantId === participantId);
    const newest = thread?.messages.at(-1)?.createdAt;
    if (!newest || !myPlayer) {
      return;
    }
    const next = { ...markers, [conversationKey(participantId)]: newest };
    setLoaded({ playerId: myPlayer.id, markers: next });
    saveReadMarkers(myPlayer.id, next);
  }

  return { total, byConversation, markRead };
}
