const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/+$/,
  "",
);

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
