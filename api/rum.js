import { handleRum } from './rum-lib.mjs'

export default async function handler(req, res) {
  await handleRum(req, res)
}
