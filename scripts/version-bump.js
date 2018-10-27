const replace = require('replace-in-file');

const currentVersion = require('../package.json').version;

const newVersion = process.argv[2];

if (newVersion) {
  const jsonOptions = {
    files: [
      './src/electron-files/package.json',
      './package.json'
    ],
    from: `"version": "${currentVersion}"`,
    to: `"version": "${newVersion}"`
  };

  replace(jsonOptions)
    .then(changedFiles => {
      console.log('Modified files:', changedFiles.join(', '));
    })
    .catch(error => {
      console.error('Error occurred:', error);
    });
} else {
  console.error('Error: You need to provide a version number');
}

