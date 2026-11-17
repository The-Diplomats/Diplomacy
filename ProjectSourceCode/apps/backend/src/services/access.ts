export type SignupMode = 'open' | 'invite';

export interface Access {
  signupMode: SignupMode;
  /** Lowercased emails allowed to create an account in invite mode. */
  signupAllowlist: ReadonlySet<string>;
  maintenanceMode: boolean;
}

export const OPEN_ACCESS: Access = {
  signupMode: 'open',
  signupAllowlist: new Set(),
  maintenanceMode: false,
};

export let access: Access = OPEN_ACCESS;

export function initAccess(config: Access): void {
  access = config;
}

/** Gates creating a new account only; sign-in to existing accounts is never restricted. */
export function canSignUp(email: string): boolean {
  return access.signupMode === 'open' || access.signupAllowlist.has(email.toLowerCase());
}
