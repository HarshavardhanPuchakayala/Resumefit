const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "resumefit_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function errorText(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => `${(d.loc || []).slice(1).join(" > ")}: ${d.msg}`)
      .join("; ");
  }
  return "Something went wrong";
}

async function send(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }
}

async function parse(response) {
  if (response.ok) return response.json();

  if (response.status === 401 && getToken()) {
    clearToken();
    window.dispatchEvent(new Event("auth-expired"));
  }

  let detail;
  try {
    detail = (await response.json()).detail;
  } catch {
    detail = undefined;
  }
  throw new ApiError(errorText(detail), response.status);
}

export async function api(path, options) {
  return parse(await send(path, options));
}

export async function download(path, filename) {
  const response = await send(path);
  if (!response.ok) await parse(response);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}