const DiscordBot = require('./src/bot/bot');
const Logger = require('./src/common/logger');
const log = new Logger('main');

const COMMANDS = {
  START: "start"
}

const token = process.env.DISCORDTOKEN;

if (!token) {
    throw new Error('No discord token provided.');
}

const bot = new DiscordBot(token);

const stdin = process.openStdin();

stdin.addListener("data", (command) => {
  command = command.toString().trim().toLowerCase();
  
  if (command === COMMANDS.START) {
    bot.start();
  }
});

console.log("Type \"" + COMMANDS.START + "\" to start the bot.");