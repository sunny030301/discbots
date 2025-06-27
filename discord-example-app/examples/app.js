import express from 'express';
import { InteractionType, InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions';
import { DiscordRequest } from '../utils.js';
import { getSoundCloudUrl } from './commands.js';

// Create and configure express app
const app = express();
app.use(express.json());

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
