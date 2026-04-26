export const translateWithFallback = (t, key, fallback, options) => {
  const resolved = t(key, options)
  return resolved === key ? fallback : resolved
}
