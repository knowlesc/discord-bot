import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  BaseMessageComponentOptions,
  Client,
  GuildMember,
  MessageActionRowComponentResolvable,
  MessageActionRowOptions,
  VoiceChannel,
} from 'discord.js';

export function createDiscordClient() {
  return new Client({
    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'],
  });
}

export function getCurrentVoiceChannelForUser(member: GuildMember) {
  const channel = member.voice.channel as VoiceChannel;

  if (!channel) {
    throw new Error("Can't retrieve message channel");
  }

  return channel;
}

export async function connectToChannel(channel: VoiceChannel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    // TODO: For some reason the default one is not assignable to DiscordGatewayAdapterCreator
    adapterCreator: (channel.guild
      .voiceAdapterCreator as unknown) as DiscordGatewayAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10e3);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

export async function playAudioFileToVoiceChannel(
  channel: VoiceChannel,
  filepath: string,
  player: AudioPlayer
) {
  if (!channel) {
    throw new Error('No voice channel provided to play audio file to');
  }

  if (!filepath) {
    throw new Error('No audio file path provided');
  }

  if (!channel.joinable) {
    throw new Error(
      'Unable to join voice channel due to insufficient permissions'
    );
  }

  const connection = await connectToChannel(channel);
  connection.subscribe(player);
  const resource = createAudioResource(filepath);
  player.play(resource);
  player.on(AudioPlayerStatus.Idle, () => {
    connection.disconnect();
  });

  await entersState(player, AudioPlayerStatus.Playing, 5e3);
  return connection;
}

export function createButtonList(data: string[]) {
  return data
    .slice(0, 25)
    .map(
      (c) =>
        ({
          type: 2,
          label: c,
          style: 1,
          customId: c,
        } as MessageActionRowComponentResolvable)
    )
    .reduce((acc, component, i) => {
      if (i % 5 === 0)
        acc.push({
          type: 1,
          components: [],
        });
      acc[acc.length - 1].components.push(component);
      return acc;
    }, [] as (Required<BaseMessageComponentOptions> & MessageActionRowOptions)[]);
}
