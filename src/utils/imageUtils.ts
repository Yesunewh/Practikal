
/**
 * Utility to get the full URL for a resource.
 * If the path is relative (starts with /), it prepends the backend URL if in production,
 * or relies on the Vite proxy in development.
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // In development, Vite proxies /uploads to the backend.
  // In production, we might need to prepend the actual API base URL.
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'https://practicalbackend.paperless.et/api').replace(/\/api\/?$/, '');
  
  return `${apiBase}${path}`;
}
