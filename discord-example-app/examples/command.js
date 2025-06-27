import 'dotenv/config';

// Load SoundCloud client ID from .env
const clientId = process.env.SOUNDCLOUD_CLIENT_ID;

// SoundCloud API: fetching track details and stream URL using client_id
export async function getSoundCloudUrl(trackId) {
  const baseUrl = "https://api.soundcloud.com";

  try {
    // Fetch track details
    const trackResponse = await fetch(`${baseUrl}/tracks/${trackId}?client_id=${clientId}`);
    if (!trackResponse.ok) {
      throw new Error(`Failed to fetch track details: ${trackResponse.statusText}`);
    }
    const trackData = await trackResponse.json();

    // Fetch stream URL - SoundCloud sends a 302 redirect with the actual stream URL in 'location' header
    const streamResponse = await fetch(`${baseUrl}/tracks/${trackId}/stream?client_id=${clientId}`, {
      redirect: 'manual', // do not automatically follow redirect
    });
    if (streamResponse.status !== 302) {
      throw new Error(`Failed to fetch stream URL: ${streamResponse.statusText}`);
    }
    const streamUrl = streamResponse.headers.get('location');

    return {
      trackInfo: trackData,
      streamUrl: streamUrl,
    };
  } catch (error) {
    console.error('Error fetching SoundCloud stream:', error);
    throw error;
  }
}
