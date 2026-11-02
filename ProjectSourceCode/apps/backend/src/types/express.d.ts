import type { DiplomacySurface } from '../surface.js';

declare global {
  namespace Express {
    interface Request {
      surface: DiplomacySurface;
    }
  }
}
