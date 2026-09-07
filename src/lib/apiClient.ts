/**
 * API client for the local deterministic print-toolkit endpoints.
 *
 * The dev server exposes these under /api/print/*. This client:
 *  - always requests and expects JSON,
 *  - throws a real Error on non-2xx responses or non-JSON bodies
 *    (so the UI never silently swallows a routing problem such as the SPA
 *    returning <!doctype html> for an API path),
 *  - never fabricates fallback data.
 */

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  } catch (err) {
    throw new Error(`Network error calling ${path}: ${(err as Error).message}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let detail = '';
    if (contentType.includes('application/json')) {
      try {
        const j = await res.json();
        detail = j?.error || '';
      } catch {
        /* ignore parse error */
      }
    }
    throw new Error(detail || `${path} responded with HTTP ${res.status}.`);
  }

  if (!contentType.includes('application/json')) {
    // This is the classic "frontend received HTML instead of JSON" routing bug.
    const text = await res.text();
    const looksLikeHtml = text.trim().toLowerCase().startsWith('<!doctype') || text.trim().startsWith('<');
    throw new Error(
      looksLikeHtml
        ? `${path} returned HTML instead of JSON — the API route is not wired up on this server.`
        : `${path} returned a non-JSON response (${contentType || 'unknown content type'}).`,
    );
  }

  return (await res.json()) as T;
}
