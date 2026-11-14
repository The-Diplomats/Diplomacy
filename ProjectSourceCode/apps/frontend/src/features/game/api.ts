import {
  getGameMessages as getGameMessagesRequest,
  type Message,
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
