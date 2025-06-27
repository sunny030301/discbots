import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const LPLAY = {
  name: 'lplay',
  description: 'Play song from SoundCloud with link',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
}

const JOIN = {
  name: 'join',
  description: 'joins a vc',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
}

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, JOIN];
InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);


app.use(express.json());

// Load SoundCloud client ID from .env
const clientId = process.env.SOUNDCLOUD_CLIENT_ID;

// SoundCloud API: fetching track details and stream URL using client_id
async function getSoundCloudUrl(trackId) {
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

app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  const { type, data } = req.body;

  if (type === InteractionType.APPLICATION_COMMAND) {
    if (data.name === 'test') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: 'A wild message appeared' },
      });
    }

    if (data.name === 'play') {
      const trackId = data.options?.find(opt => opt.name === 'track_id')?.value;

      if (!trackId) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Track ID is missing...' },
        });
      }

      try {
        const { trackInfo, streamUrl } = await getSoundCloudUrl(trackId);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Playing: **${trackInfo.title}** by ${trackInfo.user.username}\nStream URL: ${streamUrl}`,
          },
        });
      } catch (error) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Failed to fetch the track. Please try again.' },
        });
      }
    }
  }
});

async function createCommand() {
  const appId = process.env.APP_ID;

  const globalEndpoint = `applications/${appId}/commands`;

  const commandBody = {
    name: 'play',
    description: 'Play a track from SoundCloud',
    options: [
      {
        name: 'track_id',
        description: 'ID of the track',
        type: 3,
        required: true,
      },
    ],
    type: 1,
  };

  try {
    const res = await DiscordRequest(globalEndpoint, {
      method: 'POST',
      body: commandBody,
    });
    console.log('Command registered:', await res.json());
  } catch (err) {
    console.error('Error installing commands: ', err);
  }
}

app.listen(3000, () => {
  console.log('Listening on port 3000');
  createCommand();
});
