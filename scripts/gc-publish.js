const { exec } = require('child_process');
const currentVersion = require('./package.json').version;

const platform = process.argv[2];

if (!platform) {
  console.error('Error: You need to provide a platform (win|mac|linux|all');
} else {
  // upload installation file
  if (platform === 'win' || platform === 'all') {
    exec('gsutil -h "Cache-Control:max-age=31536000" cp -a public-read packages/mockoon.setup.' + currentVersion + '.exe gs://releases.mockoon.com/mockoon.setup.' + currentVersion + '.exe');
  }

  if (platform === 'mac' || platform === 'all') {
    exec('gsutil -h "Cache-Control:max-age=31536000" cp -a public-read packages/mockoon.setup.' + currentVersion + '.dmg gs://releases.mockoon.com/mockoon.setup.' + currentVersion + '.dmg');
  }

  if (platform === 'linux' || platform === 'all') {
    exec('gsutil -h "Cache-Control:max-age=31536000" cp -a public-read packages/mockoon-' + currentVersion + '-x86_64.AppImage gs://releases.mockoon.com/mockoon-' + currentVersion + '-x86_64.AppImage');
  }

  if (platform === 'file' || platform === 'all') {
    // upload json file (after binaries to avoid erroneous updates during the upload)
    exec('gsutil -h "Cache-Control:private" cp -a public-read updates.json gs://releases.mockoon.com/updates.json');
  }
}
