import * as program from 'commander';
import { DiscordBot } from './bot/bot';
import { Logger } from './common/logger';

const log = new Logger('main');

const token = process.env.DISCORDTOKEN;
if (!token) {
    throw new Error('No discord token provided.');
}

program
  .option('-a, --autostart')
  .option('-d, --debug')
  .parse(process.argv);

const bot = new DiscordBot(token, program.debug === true);

if (program.autostart) {
  bot.start();
} else {
  const COMMANDS = {
    START: 'start'
  };

  const stdin = process.openStdin();

  stdin.addListener('data', (command) => {
    command = command.toString().trim().toLowerCase();

    if (command === COMMANDS.START) {
      bot.start();
    }
  });

  console.log('Type "' + COMMANDS.START + '" to start the bot.');
}
