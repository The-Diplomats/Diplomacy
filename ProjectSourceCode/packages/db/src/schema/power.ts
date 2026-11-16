import { POWERS } from '@diplomacy/game-types';
import { pgEnum } from 'drizzle-orm/pg-core';

// Own file because both games and players use it, and players imports games.
export const power = pgEnum('power', POWERS);
