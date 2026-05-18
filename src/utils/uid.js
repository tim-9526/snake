// crypto.randomUUID() is available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)
// and is collision-safe (128-bit random). Centralised here to avoid duplication.
export const uid = () => crypto.randomUUID()
