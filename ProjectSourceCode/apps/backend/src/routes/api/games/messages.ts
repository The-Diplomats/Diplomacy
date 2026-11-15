import type {
  GetGameMessagesPathParams,
  Message,
  MessageList,
  PostGameMessagePathParams,
  ProblemDetails,
  SendMessageRequest,
} from '@diplomacy/contracts';
import { type Request, type Response, Router } from 'express';

import type { MessageWithSender } from '../../../repositories/messages.js';
import { db } from '../../../services/db.js';

function toMessage(row: MessageWithSender): Message {
  return {
    id: row.id,
    gameId: row.gameId,
    fromPlayerId: row.fromPlayerId,
    fromUsername: row.fromUsername,
    fromPower: row.fromPower,
    toPlayerId: row.toPlayerId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  };
}

export const messagesRouter = Router();

messagesRouter.post(
  '/:gameId/messages',
  async (
    req: Request<PostGameMessagePathParams, Message | ProblemDetails, SendMessageRequest>,
    res: Response<Message | ProblemDetails>,
  ) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ title: 'Unauthorized', status: 401, detail: 'Not logged in.' });
    }

    const player = await db.players.findByUserInGame({
      gameId: req.params.gameId,
      userId: user.id,
    });
    if (!player) {
      return res
        .status(403)
        .json({ title: 'Forbidden', status: 403, detail: 'User is not a part of this game.' });
    }

    const text = req.body.text.trim();
    if (text.length === 0) {
      return res
        .status(400)
        .json({ title: 'Bad Request', status: 400, detail: 'Message cannot be empty.' });
    }

    const message = await db.messages.create({
      gameId: req.params.gameId,
      fromPlayerId: player.id,
      text,
    });

    return res
      .status(201)
      .json(toMessage({ ...message, fromUsername: user.username, fromPower: player.power }));
  },
);

messagesRouter.get(
  '/:gameId/messages',
  async (
    req: Request<GetGameMessagesPathParams, MessageList | ProblemDetails>,
    res: Response<MessageList | ProblemDetails>,
  ) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ title: 'Unauthorized', status: 401, detail: 'Not logged in' });
    }

    const player = await db.players.findByUserInGame({
      gameId: req.params.gameId,
      userId: user.id,
    });
    if (!player) {
      return res
        .status(403)
        .json({ title: 'Forbidden', status: 403, detail: 'User is not a part of this game' });
    }

    const rows = await db.messages.listPublicByGame(req.params.gameId);
    return res.status(200).json({ messages: rows.map(toMessage) });
  },
);
