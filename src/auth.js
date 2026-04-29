const http = require('http');
const crypto = require('crypto');
const axios = require('axios');
const open = require('open');
const { saveCredentials, clearCredentials, getCredentials, API_BASE_URL } = require('./config');

function generateCodeVerifier() {
  return crypto.randomBytes(64).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

async function login() {
  return new Promise((resolve, reject) => {
    // Start local callback server on random port
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost');

      if (url.pathname !== '/callback') {
        res.end('Not found');
        return;
      }

      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        res.end('Authentication failed. You can close this tab.');
        server.close();
        reject(new Error('No tokens received'));
        return;
      }

      // Get user info
      try {
        const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-API-Version': '1',
          },
        });

        const user = userRes.data.data;

        saveCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
          username: user.username,
          role: user.role,
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h2>✅ Successfully logged in as @${user.username}</h2>
              <p>You can close this tab and return to the terminal.</p>
            </body>
          </html>
        `);

        server.close();
        resolve(user);
      } catch (err) {
        res.end('Authentication failed.');
        server.close();
        reject(err);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const state = `cli_${port}`;

      const authUrl = `${API_BASE_URL}/auth/github?state=${state}`;

      console.log('Opening browser for GitHub authentication...');
      console.log(`If browser doesn't open, visit: ${authUrl}\n`);

      open(authUrl).catch(() => {
        console.log(`Please open this URL manually: ${authUrl}`);
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Login timed out'));
    }, 5 * 60 * 1000);
  });
}

async function logout() {
  const credentials = getCredentials();
  if (!credentials) {
    console.log('Not logged in.');
    return;
  }

  try {
    await axios.post(`${API_BASE_URL}/auth/logout`, {
      refresh_token: credentials.refresh_token,
    }, {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
    });
  } catch {
    // Ignore errors on logout
  }

  clearCredentials();
  console.log('Logged out successfully.');
}

async function whoami() {
  const credentials = getCredentials();
  if (!credentials) {
    console.log('Not logged in. Run: insighta login');
    return;
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        'X-API-Version': '1',
      },
    });
    const user = res.data.data;
    console.log(`Logged in as @${user.username} (${user.role})`);
  } catch {
    console.log(`Logged in as @${credentials.username} (${credentials.role})`);
  }
}

module.exports = { login, logout, whoami };