/**
 * Tiny className joiner. Keeps conditional class lists readable without
 * pulling in a dependency.
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default cn;
