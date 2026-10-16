import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import type { User } from "./api";

export default function Workspace({ user, page }: { user: User | null; page: string }) {
  const allowed = user !== null && (
    page === "customer" ? user.role_name === "customer" :
    page === "staff" ? ["staff", "administrator"].includes(user.role_name) :
    page === "admin" && user.role_name === "administrator"
  );
  const [message, setMessage] = useState("Loading workspace...");
  useEffect(() => {
    if (!allowed || !user) return;
    const controller = new AbortController();
    const path = page === "customer" ? `/customers/${user.id}` : `/${page}/workspace`;
    setMessage("Loading workspace...");
    apiRequest(path, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      setMessage(page === "customer" ? `Your account: ${data.email}` : data.message);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Unable to load workspace.");
    });
    return () => controller.abort();
  }, [allowed, page, user]);
  if (!allowed) return <p role="alert">Sign in with an authorized account to access this page.</p>;
  return <section><h2>{page} workspace</h2><p role="status">{message}</p></section>;
}
