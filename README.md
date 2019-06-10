# discord-bot

Plays mp3 files located in the audio folder in the user's current voice channel.

To list possible commands: !\<botname\>
To play an audio file: !\<botname\> play \<audio file name (without extension)\>

Requires:

1. Discord bot added to your server with sufficient permissions.

2. DISCORDTOKEN environment variable set.

3. FFMPEG and either build-essential (linux) or Visual C++ Tools (windows).

4. Node version 8 to compile node-opus.

Run npm install && npm start.
