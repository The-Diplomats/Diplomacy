import type {
  GetGamePlayersPathParams,
  Player,
  PlayerList,
  ProblemDetails,
} from '@diplomacy/contracts';
import { type Request, type Response, Router } from 'express';

import type { PlayerWithUsername } from '../../../repositories/players.js';
import { db } from '../../../services/db.js';

function toPlayer(row: PlayerWithUsername): Player {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    power: row.power,
    isAi: row.isAi,
    afkCounter: row.afkCounter,
    locked: row.locked,
  };
}

export const playersRouter = Router();

playersRouter.get(
  '/:gameId/players',
  async (
    req: Request<GetGamePlayersPathParams, PlayerList | ProblemDetails>,
    res: Response<PlayerList | ProblemDetails>,
  ) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Not logged in.',
      });
    }

    const seat = await db.players.findByUserInGame({
      gameId: req.params.gameId,
      userId: user.id,
    });
    if (!seat) {
      return res.status(403).json({
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'User is not a part of this game',
      });
    }

    const rows = await db.players.listWithUsernamesByGame(req.params.gameId);
    return res.status(200).json({ players: rows.map(toPlayer) });
  },
);
