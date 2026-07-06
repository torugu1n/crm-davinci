export function getLogoUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
