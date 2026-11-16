export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** 0–4: length ≥ 8, mixed case, digit, symbol. */
export const passwordStrength = (password: string) =>
  [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
