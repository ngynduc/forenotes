import { state } from "./state.js";

export async function api(url, method = "GET", body = null, includeAuth = true) {
  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  if (includeAuth && state.activeUserId) {
    headers["x-user-id"] = state.activeUserId;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(formatApiError(payload, `${method} ${url} failed`));
  }

  if (response.status === 204) {
    return {};
  }

  return response.json();
}

function formatApiError(payload, fallback) {
  if (!payload?.error) {
    return fallback;
  }
  if (payload.error === "Missing permission" && payload.details?.permission) {
    return `Missing permission: ${payload.details.permission}`;
  }
  return payload.error;
}
