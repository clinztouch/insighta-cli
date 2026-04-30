const axios = require('axios');
const { API_BASE_URL, getCredentials, saveCredentials, clearCredentials } = require('./config');




async function refreshTokens(refreshToken) {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken
    });
    return response.data;
}


async function request(method, path, options = {}) {
    const credentials = getCredentials();


    if (!credentials) {
        console.error('Not logged in. Run: insighta login');
        process.exit(1);
    }

   const headers = {
    'Authorization': `Bearer ${credentials.access_token}`,
    'X-API-Version': '1',
    ...options.headers,
  };

  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${path}`,
      headers,
      params: options.params,
      data: options.data,
    });
    return response.data;
  } catch (error) {
    // Token expired — try refresh
    if (error.response?.status === 401 && credentials.refresh_token) {
      try {
        const tokens = await refreshTokens(credentials.refresh_token);
        saveCredentials({
          ...credentials,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });

        // Retry original request with new token
        const retryResponse = await axios({
          method,
          url: `${API_BASE_URL}${path}`,
          headers: {
            ...headers,
            'Authorization': `Bearer ${tokens.access_token}`,
          },
          params: options.params,
          data: options.data,
        });
        return retryResponse.data;
      } catch {
        console.error('Session expired. Please login again: insighta login');
        clearCredentials();
        process.exit(1);
      }
    }

    if (error.response?.status === 403) {
      console.error('Access denied. You do not have permission to perform this action.');
      process.exit(1);
    }

    const message = error.response?.data?.message || error.message;
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

module.exports = { request };