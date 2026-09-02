export function applyServerEnv(env?: Record<string, string>): void
export function verifyCmsUser(req: unknown): Promise<{
  id: string
  email: string
  token: string
} | null>
export function json(res: unknown, status: number, payload: unknown): void
