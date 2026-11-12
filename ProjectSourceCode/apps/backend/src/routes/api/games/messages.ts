import { type Request, type Response, Router } from 'express';

import { db } from '../../../services/db.js';

interface MessageParams {
  gameId: string;
}

interface SendMessageBody {
  text: string;
}

export const messagesRouter = Router();

messagesRouter.post(
  '/:gameId/messages',
  async (req: Request<MessageParams, unknown, SendMessageBody>, res: Response) => {
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

    return res.status(201).json({
      id: message.id,
      gameId: message.gameId,
      fromPlayerId: message.fromPlayerId,
      toPlayerId: message.toPlayerId,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    });
  },
);
