export function handleRum(req: unknown, res: unknown): Promise<void>
export function loadRumSince(
  since: string,
  opts?: { accessToken?: string },
): Promise<unknown[]>
export function listSpeedTests(opts?: {
  accessToken?: string
  limit?: number
}): Promise<unknown[]>
export function insertSpeedTest(
  row: Record<string, unknown>,
  opts?: { accessToken?: string },
): Promise<unknown>
export function patchSpeedTest(
  id: string,
  patch: Record<string, unknown>,
  opts?: { accessToken?: string },
): Promise<boolean>
