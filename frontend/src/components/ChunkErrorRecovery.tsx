'use client';

import { useEffect } from 'react';

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /CSS_CHUNK_LOAD_FAILED/i,
];

function extractErrorMessage(errorLike: unknown) {
  if (typeof errorLike === 'string') {
    return errorLike;
  }

  if (errorLike && typeof errorLike === 'object') {
    const maybeMessage = (errorLike as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return '';
}

function isChunkError(message: string, filename?: string) {
  if (filename?.includes('/_next/static/chunks/')) {
    return true;
  }

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export default function ChunkErrorRecovery() {
  useEffect(() => {
    const reloadKey = `chunk-reload:${window.location.pathname}`;

    const cleanupReloadMarker = () => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('__chunk_retry')) {
        url.searchParams.delete('__chunk_retry');
        window.history.replaceState(window.history.state, '', url.toString());
      }

      sessionStorage.removeItem(reloadKey);
    };

    const reloadOnce = () => {
      if (sessionStorage.getItem(reloadKey)) {
        return;
      }

      sessionStorage.setItem(reloadKey, String(Date.now()));
      const url = new URL(window.location.href);
      url.searchParams.set('__chunk_retry', Date.now().toString());
      window.location.replace(url.toString());
    };

    const onWindowError = (event: ErrorEvent) => {
      if (isChunkError(event.message || '', event.filename)) {
        reloadOnce();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = extractErrorMessage(event.reason);
      if (isChunkError(message)) {
        reloadOnce();
      }
    };

    cleanupReloadMarker();
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
