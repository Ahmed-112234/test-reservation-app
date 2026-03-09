const apiBaseUrl = "http://localhost:4000";

/* This function gets the saved login token. */
function getToken() {
  return localStorage.getItem("token");
}

/* This function sends requests to the backend API. */
export async function sendApiRequest(path, options = {}) {
  const token = getToken();

  const requestHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: requestHeaders
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}