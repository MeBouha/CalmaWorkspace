// Client-side helper: fetch JSON and normalize French error messages.
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; fieldErrors: Record<string, string> };

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: body as T };
    return {
      ok: false,
      status: res.status,
      error: body.error ?? "Une erreur est survenue.",
      fieldErrors: body.fieldErrors ?? {},
    };
  } catch {
    return { ok: false, status: 0, error: "Impossible de contacter le serveur.", fieldErrors: {} };
  }
}
