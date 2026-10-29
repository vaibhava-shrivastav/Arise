/**
 * ARISE — API Client
 * Shared fetch wrapper with automatic credentials, JSON parsing, and 401 handling
 */

async function apiRequest(path, options = {}) {
  const defaultHeaders = {
    'Accept': 'application/json',
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    credentials: 'same-origin',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(path, config);

    // If unauthorized, redirect to login page immediately
    if (response.status === 401) {
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/';
      }
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMsg = data?.error || (data?.details ? JSON.stringify(data.details) : `Request failed with status ${response.status}`);
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

/**
 * Perform a GET request
 * @param {string} path 
 * @returns {Promise<any>}
 */
function apiGet(path) {
  return apiRequest(path, { method: 'GET' });
}

/**
 * Perform a POST request
 * @param {string} path 
 * @param {any} body 
 * @returns {Promise<any>}
 */
function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Perform a PATCH request
 * @param {string} path 
 * @param {any} body 
 * @returns {Promise<any>}
 */
function apiPatch(path, body) {
  return apiRequest(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

