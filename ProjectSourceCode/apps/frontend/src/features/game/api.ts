import {
  getGameDmMessages as getGameDmMessagesRequest,
  getGameMessages as getGameMessagesRequest,
  getGamePlayers as getGamePlayersRequest,
  type Message,
  type Player,
  postGameDmMessage as postGameDmMessageRequest,
  postGameMessage as postGameMessageRequest,
} from '@diplomacy/contracts';

import { apiClient } from '../../api/client';

export async function getGameMessages(gameId: string, signal?: AbortSignal): Promise<Message[]> {
  const response = await getGameMessagesRequest(gameId, { client: apiClient, signal });
  return response.messages;
}

export function postGameMessage(gameId: string, text: string): Promise<Message> {
  return postGameMessageRequest(gameId, { text }, { client: apiClient });
}

export async function getGamePlayers(gameId: string, signal?: AbortSignal): Promise<Player[]> {
  const response = await getGamePlayersRequest(gameId, {
    client: apiClient,
    signal,
  });
  return response.players;
}

export async function getDmThread(
  gameId: string,
  participantId: string,
  signal?: AbortSignal,
): Promise<Message[]> {
  const response = await getGameDmMessagesRequest(gameId, participantId, {
    client: apiClient,
    signal,
  });
  return response.messages;
}

export function postDm(gameId: string, participantId: string, text: string): Promise<Message> {
  return postGameDmMessageRequest(gameId, participantId, { text }, { client: apiClient });
}
