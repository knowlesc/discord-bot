import * as fs from 'fs';
const audioFileBaseDirectory = './audio/';

export class FileUtils {

  static findAudioFile(filename: string) {
    const fullpath = audioFileBaseDirectory + filename + '.mp3';

    if (fs.existsSync(fullpath)) {
      return fullpath;
    } else {
      return null;
    }
  }

  static listAudioFileNames() {
    const files = fs.readdirSync(audioFileBaseDirectory);
    if (!files) {
      return null;
    }

    const acceptedFileType = /^\w+\.mp3$/;
    const acceptedFiles = files.filter((file) => acceptedFileType.test(file))
      .map((file) => file.slice(0, file.lastIndexOf('.')));

    return acceptedFiles;
  }
}