import * as Discord from 'discord.js';
import { Logger } from '../common/logger';
import { FileUtils } from '../common/fileutils';

export class DiscordBot {

  name: string;
  log: Logger;
  client: Discord.Client;
  currentChannel: Discord.VoiceChannel;

  constructor(
    private token: string,
    private debug: boolean) {
    if (!token) throw new Error('No token provided to bot');

    this.client = new Discord.Client();
    this.log = new Logger('bot');
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
      this.name = this.client.user.username;
    });

    this.client.on('disconnect', () => {
      this.log.info('Bot has disconnected');
    });

    this.client.on('reconnecting', () => {
      this.log.info('Bot is reconnecting');
    });

    this.client.on('message', (message) => {
      this.handleMessage(message);
    });

    this.client.on('error', (error) => {
      this.log.error(error, 'client');
    });

    this.client.login(this.token);
  }

  handleMessage(message: Discord.Message) {
    const audioCommandFilenameOnly = /\w+$/;
    const audioCommand = new RegExp(`^!${this.name} play \\w+$`);
    const listCommand = new RegExp(`^!${this.name}$`);
    const stopCommand = new RegExp(`^(sh(h+))|(shut up)|(stop)|(quiet)|(don't)|(no more)|(quit it)$`);
    const unknownCommand = new RegExp(`^!${this.name} .+`);

    const text = message.content;

    if (audioCommand.test(text)) {
      const filename = audioCommandFilenameOnly.exec(text)[0];
      const channel = this.getCurrentVoiceChannelForUser(message.member);
      const filepath = FileUtils.findAudioFile(filename);

      if (filepath) {
        this.playAudioFileToVoiceChannel(channel, filepath);
      } else {
        message.channel.send(`No audio clip named ${filename} exists`);
      }
    } else if (listCommand.test(text)) {
      message.channel.send(this.getCommandListMessage());
    } else if (unknownCommand.test(text)) {
      message.channel.send(this.getCommandListMessage());
    } else if (stopCommand.test(text)) {
      if (this.currentChannel) {
        this.currentChannel.leave();
      }
    }
  }

  getCommandListMessage() {
    const audioFiles = FileUtils.listAudioFileNames();
    if (!audioFiles) {
      return 'There are no audio clips available to play';
    }

    const audioFileList = audioFiles.join('\n');
    const listText =
`Available commands:
!${this.name} play <audio clip name>

Available audio clips:
\`\`\`
${audioFileList}
\`\`\`
`;

    return listText;
  }

  playAudioFileToVoiceChannel(channel: Discord.VoiceChannel, filepath: string) {

    if (!channel) {
      this.log.info('No voice channel provided to play audio file to');

      return;
    }

    if (!filepath) {
      this.log.info('No audio file path provided');

      return;
    }

    if (!channel.joinable) {
      this.log.info('Unable to join voice channel due to insufficient permissions');

      return;
    }

    channel.join()
      .then((connection) => {
        this.currentChannel = channel;

        if (this.debug) {
          connection.on('debug', (message) => {
            this.log.debug(message, 'connection');
          });
        }

        connection.on('warn', (error) => {
          this.log.error(error, 'connection');
        });

        connection.on('error', (error) => {
          this.log.error(error, 'connection');
        });

        connection.on('disconnect', () => {
          this.log.info(`Disconnected from channel ${channel.name}`);
          this.currentChannel = null;
        });

        this.log.info(`Connected to channel ${channel.name}`);

        const dispatcher = connection.playFile(filepath);

        dispatcher.once('start', () => {
          this.log.info('Starting playback of audio file');
        });

        if (this.debug) {
          dispatcher.on('debug', (message) => {
            this.log.debug(message, 'dispatcher');
          });
        }

        dispatcher.once('error', (error) => {
          this.log.error(error, 'dispatcher');
          channel.leave();
        });

        dispatcher.once('end', () => {
          channel.leave();
        });
      })
      .catch((error) => {
        this.log.error(error, 'connection');
        this.currentChannel = null;
      });
  }

  getCurrentVoiceChannelForUser(member: Discord.GuildMember) {
    const channel = member.voiceChannel;

    if (!channel) {
      this.log.error('Can\'t retrieve message channel');
      throw new Error('Can\'t retrieve message channel');
    } else {
      return channel;
    }
  }
}
