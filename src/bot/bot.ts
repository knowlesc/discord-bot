import { Logger } from '../common/logger';
import { FileUtils } from '../common/fileutils';
import {
  AudioPlayer,
  createAudioPlayer,
  VoiceConnection,
} from '@discordjs/voice';
import {
  createButtonList,
  createDiscordClient,
  getCurrentVoiceChannelForUser,
  playAudioFileToVoiceChannel,
} from './discord';
import {
  ButtonInteraction,
  Client,
  GuildMember,
  Interaction,
  Message,
} from 'discord.js';

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

    this.client.on('interactionCreate', (interaction) => {
      this.handleInteraction(interaction);
    });

    this.client.on('error', (error) => {
      this.log.error(error, 'client');
    });

    this.client.login(this.token);
  }

  // TODO refactor - modular
  async handleMessage(message: Message) {
    const nameOrShortName = `((!${this.name})|(!${this.shortName}))`;
    const unknownCommand = new RegExp(`^${nameOrShortName} .+`);
    const audioCommand = new RegExp(`^${nameOrShortName} play (\\w+)$`);
    const listCommand = new RegExp(`^${nameOrShortName}$`);
    const stopCommand = new RegExp(
      `^(sh(h+))|(shut up)|(stop)|(quiet)|(don't)|(no more)|(quit it)$`
    );
    const text = message.content;

    try {
      if (audioCommand.test(text)) {
        await this.playAudio(
          message.content.split(' ').pop(),
          message.member as GuildMember
        );
      } else if (listCommand.test(text)) {
        this.listAudioCategories(message);
      } else if (unknownCommand.test(text)) {
        await message.reply(this.getCommandListMessage());
      } else if (stopCommand.test(text)) {
        this.voiceConnection?.disconnect();
      }
    } catch (e: any) {
      this.log.error(e);
      message.reply(e);
    }
  }

  async handleInteraction(interaction: Interaction) {
    try {
      if (
        interaction.isButton() &&
        interaction.message.content === 'Audio Categories'
      ) {
        this.listAudioFilesInCategory(interaction);
      } else if (
        interaction.isButton() &&
        interaction.message.content === 'Audio Files'
      ) {
        await this.playAudio(
          interaction.customId,
          interaction.member as GuildMember
        );
        interaction.reply(`Playing audio clip...`);
        interaction.deleteReply();
      } else {
        interaction.isButton() && interaction.reply('Not sure what to do');
      }
    } catch (e: any) {
      this.log.error(e);
    }
  }

  async playAudio(filename: string | undefined, member: GuildMember) {
    if (!filename || !member) return;

    const channel = getCurrentVoiceChannelForUser(member);
    const filepath = FileUtils.findAudioFile(filename);
    this.voiceConnection = await playAudioFileToVoiceChannel(
      channel,
      filepath,
      this.player
    );

    return;
  }

  async listAudioCategories(message: Message) {
    const categories = FileUtils.listAudioCategories();
    if (!categories) {
      message.reply('There are no audio clips available to play');
      return;
    }

    const components = createButtonList(categories);

    message.reply({
      content: 'Audio Categories',
      components,
    });
  }

  async listAudioFilesInCategory(interaction: ButtonInteraction) {
    const category = interaction.customId;
    const files = FileUtils.listAudioFileNames(category);
    if (!files) {
      interaction.reply({
        content: 'There are no audio clips available to play',
        ephemeral: true,
      });
      return;
    }

    const components = createButtonList(files);

    interaction.reply({
      content: 'Audio Files',
      components,
      ephemeral: true,
    });
  }

  getCommandListMessage() {
    const audioFiles = FileUtils.listAudioFileNames();
    if (!audioFiles) {
      return 'There are no audio clips available to play';
    }

    const audioFileList = audioFiles.join('\n');
    const listText = `Available commands:
!${this.shortName}
!${this.name}

Available audio clips:
\`\`\`
${audioFileList}
\`\`\`
`;

    return listText;
  }
}
