export const PASSWORD_MIN_LENGTH = 14;
export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "password123456",
  "password1234567",
  "qwerty12345678",
  "letmein1234567",
  "welcome1234567",
  "admin12345678",
  "student123456",
  "jamesai123456",
]);

export function passwordRequirements(password: string) {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
  };
}

export function isStrongPassword(password: string) {
  const checks = passwordRequirements(password);
  return Object.values(checks).every(Boolean);
}

export function passwordError(password: string) {
  if (!isStrongPassword(password)) {
    return `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters and include uppercase, lowercase, a number, and a symbol. Avoid common passwords.`;
  }
  return null;
}
