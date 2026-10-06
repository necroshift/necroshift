export function isValidEmail(value: string): boolean {
  return value.includes("@") && value.length > 2
}

export function isValidPassword(value: string): boolean {
  return value.length > 0
}
