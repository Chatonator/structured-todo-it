const CANONICAL_PUBLIC_APP_URL = 'https://chatonator.github.io/structured-todo-it/';

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export function getPublicAppUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_URL?.trim();
  if (configured) {
    return ensureTrailingSlash(configured);
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ensureTrailingSlash(`${window.location.origin}${import.meta.env.BASE_URL || '/'}`);
    }
  }

  return CANONICAL_PUBLIC_APP_URL;
}

export function getAuthRedirectUrl(path = 'auth'): string {
  const normalizedPath = path.replace(/^\/+/, '');
  return `${getPublicAppUrl()}#/${normalizedPath}`;
}

export function getPostAuthUrl(redirectTo = '/'): string {
  const normalized = redirectTo && redirectTo !== '/' ? redirectTo.replace(/^\/?/, '/') : '';
  return normalized ? `${getPublicAppUrl()}#${normalized}` : getPublicAppUrl();
}
