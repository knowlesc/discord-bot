import * as fs from 'fs';
import * as path from 'path';

const audioFileBaseDirectory = path.join(
  path.dirname(require.main!.filename),
  '../audio'
);

export class FileUtils {
  static findAudioFile(filename: string) {
    const fullpath = path.join(audioFileBaseDirectory, `${filename}.mp3`);

    if (!fs.existsSync(fullpath)) {
      throw new Error(`File not found: ${filename}`);
    }

    return fullpath;
  }

  static listAudioFileNames(category?: string) {
    const files = fs.readdirSync(audioFileBaseDirectory);
    if (!files) {
      return null;
    }

    const acceptedFileType = /^\w+\.mp3$/;
    const acceptedFiles = files
      .filter((file) => acceptedFileType.test(file))
      .map((file) => file.slice(0, file.lastIndexOf('.')))
      .filter((file) => !category || file.startsWith(`${category}_`));

    return acceptedFiles;
  }

  static listAudioCategories() {
    const files = this.listAudioFileNames();
    if (!files) return null;

    return Array.from(new Set(files.map((file) => file.split('_').shift()!)));
  }
}
