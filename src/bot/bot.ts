import { Logger } from '../common/logger';
import { FileUtils } from '../common/fileutils';
import {
  AudioPlayer,
  createAudioPlayer,
  VoiceConnection,
} from '@discordjs/voice';
import {
  createDiscordClient,
  getCurrentVoiceChannelForUser,
  playAudioFileToVoiceChannel,
} from './discord';
import { Client, Message } from 'discord.js';

export class DiscordBot {
  // will be replaced on login
  name: string = 'temp';
  shortName: string = 'temp';

  log: Logger;
  client: Client;
  player: AudioPlayer;
  voiceConnection: VoiceConnection | undefined;

  constructor(private token: string, private debug: boolean) {
    if (!token) throw new Error('No token provided to bot');

    this.log = new Logger('bot');
    this.client = createDiscordClient();
    this.player = createAudioPlayer();
  }

  start() {
    this.log.info('Starting bot');

    if (this.debug) {
      this.client.on('debug', (message) => {
        this.log.debug(message, 'client');
      });
    }

    this.client.on('ready', () => {
      this.log.info('Bot is connected');
      this.name = this.client.user!.username;
      this.shortName = `${this.name[0]}b`; // b for "bot"
    });

    this.client.on('disconnect', () => {
      this.log.info('Bot has disconnected');
    });

    this.client.on('reconnecting', () => {
      this.log.info('Bot is reconnecting');
    });

    this.client.on('messageCreate', (message) => {
      this.handleMessage(message);
    });

    this.client.on('error', (error) => {
      this.log.error(error, 'client');
    });

    this.client.login(this.token);
  }

  // TODO refactor - modular
  async handleMessage(message: Message) {
    const nameOrShortName = `(!${this.name})|(!${this.shortName})`;
    const unknownCommand = new RegExp(`^${nameOrShortName} .+`);
    const audioCommand = new RegExp(`^${nameOrShortName} play (\\w+)$`);
    const listCommand = new RegExp(`^${nameOrShortName}$`);
    const stopCommand = new RegExp(
      `^(sh(h+))|(shut up)|(stop)|(quiet)|(don't)|(no more)|(quit it)$`
    );
    const text = message.content;

    try {
      if (audioCommand.test(text)) {
        await this.playAudio(message);
      } else if (listCommand.test(text)) {
        await message.reply(this.getCommandListMessage());
      } else if (unknownCommand.test(text)) {
        await message.reply(this.getCommandListMessage());
      } else if (stopCommand.test(text)) {
        this.voiceConnection?.disconnect();
      }
    } catch (e: any) {
      this.log.error(e);
    }
  }

  async playAudio(message: Message) {
    const filename = message.content.split(' ').pop();
    if (!filename || !message.member) return;

    const channel = getCurrentVoiceChannelForUser(message.member);
    const filepath = FileUtils.findAudioFile(filename);
    this.voiceConnection = await playAudioFileToVoiceChannel(
      channel,
      filepath,
      this.player
    );
  }

  getCommandListMessage() {
    const audioFiles = FileUtils.listAudioFileNames();
    if (!audioFiles) {
      return 'There are no audio clips available to play';
    }

    const audioFileList = audioFiles.join('\n');
    const listText = `Available commands:
!${this.name} play <audio clip name>

Available audio clips:
\`\`\`
${audioFileList}
\`\`\`
`;

    return listText;
  }
}
