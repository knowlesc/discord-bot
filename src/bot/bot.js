const Discord = require('discord.js');
const Logger = require('../common/logger');
const FileUtils = require('../common/fileutils');

class DiscordBot {

  constructor(token) {
    if (!token) {
      throw new Error("No token provided to bot");
    }

    this.token = token;
    this.client = new Discord.Client({ autoReconnect: true });
    this.log = new Logger('bot');
  }

  start() {
    this.log.info("Starting bot");

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

    this.client.on('error', this.log.error);

    this.client.on('message', (message) => {
      this.handleMessage(message);
    });

    this.client.login(this.token);
  }

  handleMessage(message) {
    const audioCommand = new RegExp('^!' + this.name + ' play \\w+$');
    const audioCommandFilenameOnly = /\w+$/;
    const listCommand = new RegExp('^!' + this.name + '$');

    const text = message.content;

    if (listCommand.test(text)) {
      message.channel.sendMessage(this.getCommandListMessage());
    } else if (audioCommand.test(text)) {
      const filename = audioCommandFilenameOnly.exec(text);
      const channel = this.getCurrentVoiceChannelForUser(message.member);
      const filepath = FileUtils.findAudioFile(filename);

      if (filepath) {
        this.playAudioFileToVoiceChannel(channel, filepath);
      } else {
        message.channel.sendMessage('No audio clip named ' + filename + ' exists');
      }
    }
  }

  getCommandListMessage() {
    const audioFiles = FileUtils.listAudioFileNames();
    if (!audioFiles) {
      return 'There are no audio clips available to play';
    }

    const commandListHeader = 'Available commands: \n';
    const playFileCommand = '!' + this.name + ' play <audio clip name> \n\n'

    const audioFileListHeader = 'Available audio clips: \n'
    const audioFileList = audioFiles.join(' ');

    return commandListHeader + playFileCommand + audioFileListHeader + audioFileList;
  }

  playAudioFileToVoiceChannel(channel, filepath) {

    if (!channel) {
      this.log.info("No voice channel provided to play audio file to");
      return;
    }

    if (!filepath) {
      this.log.info("No audio file path provided");
      return;
    }

    if (!channel.joinable) {
      this.log.info("Unable to join voice channel due to insufficient permissions");
      return;
    }

    channel.join()
      .then((connection) => {
        connection.on('warn', this.log.info);
        connection.on('error', this.log.error);
        connection.on('disconnect', () => {
          this.log.info("Disconnected from channel " + channel.name);
        })

        this.log.info("Connected to channel " + channel.name);

        const dispatcher = connection.playFile(filepath);

        dispatcher.once('start', () => {
          this.log.info("Starting playback of audio file");
        });

        dispatcher.once('error', this.log.error);

        dispatcher.once('end', () => {
          channel.leave();
        });
      })
      .catch((error) => {
        this.log.error(error);
      });
  }

  getCurrentVoiceChannelForUser(member) {
    var channel = member.voiceChannel;

    if (!channel) {
      this.log.info("Can't retrieve message channel");
    } else {
      return channel;
    }
  }

}

module.exports = DiscordBot;