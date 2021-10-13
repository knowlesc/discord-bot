import { promisify } from 'util';
import { exec as _exec } from 'child_process';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import _ncp from 'ncp';

const exec = promisify(_exec);
const ncp = promisify(_ncp);

const deployFolder = 'deploy';
const deployBranch = 'deploy';
const runFromDeployFolder = { cwd: deployFolder };

async function cleanup() {
  console.log('Cleaning up');
  rmSync(deployFolder, { recursive: true, force: true });
  await exec(`git worktree remove ${deployFolder}`).catch(() => null);
  await exec(`git branch -D ${deployBranch}`).catch(() => null);
}

try {
  await cleanup();

  console.log('Creating deployment branch');
  await exec(`git branch ${deployBranch} master`);
  await exec(`git worktree add -f ${deployFolder} ${deployBranch}`);

  // remove local audio files from gitignore temporarily to deploy to heroku
  console.log('Adding ignored files');
  writeFileSync(
    `${deployFolder}/.gitignore`,
    readFileSync(`${deployFolder}/.gitignore`, 'utf-8').replace(
      'audio/*.mp3',
      ''
    ),
    'utf-8'
  );

  await ncp(`audio`, `${deployFolder}/audio`, { clobber: true });

  await exec('git add --all', runFromDeployFolder);
  await exec('git commit -a -m "Deploy to Heroku"', runFromDeployFolder);

  console.log('Pushing to heroku');
  await exec(`git push -f heroku ${deployBranch}:master`, runFromDeployFolder);
} catch (e) {
  console.error(e);
} finally {
  cleanup();
}
