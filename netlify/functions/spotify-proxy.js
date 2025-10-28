const axios = require('axios');

let tokenCache = {
  token: null,
  expiresAt: 0
};

async function getSpotifyToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
      }
    );

    tokenCache = {
      token: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in - 300) * 1000
    };

    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Spotify token:', error.response?.data || error.message);
    throw new Error('Authentication failed');
  }
}

exports.handler = async function(event, context) {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const path = event.path.replace('/.netlify/functions/spotify-proxy', '');
    
    const token = await getSpotifyToken();
    
    // Build query string
    const { path: _, ...restParams } = queryParams;
    const params = new URLSearchParams(restParams).toString();
    const spotifyUrl = `https://api.spotify.com/v1${path}${params ? '?' + params : ''}`;

    console.log(`Proxying request to: ${spotifyUrl}`);

    // Make request to Spotify API
    const response = await axios({
      method: event.httpMethod,
      url: spotifyUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: event.body,
      timeout: 10000
    });

    // Set cache headers
    const responseHeaders = { ...headers };
    if (path.includes('search')) {
      responseHeaders['Cache-Control'] = 'public, max-age=300';
    } else if (path.includes('tracks/') || path.includes('albums/') || path.includes('artists/')) {
      responseHeaders['Cache-Control'] = 'public, max-age=86400';
    }

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    
    if (error.response) {
      return {
        statusCode: error.response.status,
        headers,
        body: JSON.stringify(error.response.data)
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: {
          status: 500,
          message: 'Internal server error'
        }
      })
    };
  }
};

