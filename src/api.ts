const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/+$/,
  "",
);

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  default_delivery_address: string | null;
  role_name: "customer" | "staff" | "administrator";
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const data: unknown = await response.json();
    const detail = typeof data === "object" && data !== null && "detail" in data
      ? data.detail : null;
    throw new ApiError(
      response.status,
      typeof detail === "string" ? detail : "Please check the form values and try again.",
    );
  }
  return response;
}

export async function getUser(signal?: AbortSignal): Promise<User> {
  const response = await request("/auth/me", { signal });
  return response.json();
}

async function csrfToken(): Promise<string> {
  const response = await request("/auth/csrf");
  const data: unknown = await response.json();
  if (
    typeof data !== "object" || data === null ||
    !("csrf_token" in data) || typeof data.csrf_token !== "string"
  ) throw new Error("Unexpected security response. Refresh and try again.");
  return data.csrf_token;
}

export async function login(email: string, password: string): Promise<User> {
  const csrf = await csrfToken();
  const response = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function logout(): Promise<void> {
  const csrf = await csrfToken();
  await request("/auth/logout", {
    method: "POST", headers: { "X-CSRF-Token": csrf },
  });
}

export async function checkHealth(signal: AbortSignal): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/health`, { signal });
  if (!response.ok) {
    throw new Error(`API health check failed (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("status" in data) ||
    data.status !== "ok"
  ) {
    throw new Error("The API returned an unexpected health response.");
  }
}
