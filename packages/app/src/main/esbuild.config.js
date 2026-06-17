const path = require('path');
const esbuild = require('esbuild');

const args = process.argv.slice(2);
const modeIndex = args.indexOf('--mode');
const mode = modeIndex !== -1 ? args[modeIndex + 1] : 'production';
const isDev = mode === 'development';
const isTesting = args.includes('--testing');
const watch = args.includes('--watch');

const appRoot = path.resolve(__dirname, '../..');

const commonOptions = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  outdir: path.resolve(__dirname, '../../dist'),
  sourcemap: isDev,
  minify: !isDev,
  packages: 'external',
  alias: {
    src: path.resolve(appRoot, 'src')
  },
  define: {
    IS_DEV: isDev ? 'true' : 'false',
    IS_TESTING: isTesting ? 'true' : 'false',
    WEBSITE_URL: JSON.stringify(
      isDev ? 'http://localhost:3000/' : 'https://mockoon.com/'
    ),
    API_URL: JSON.stringify(
      isDev ? 'http://localhost:5003/' : 'https://api.mockoon.com/'
    )
  },
  logLevel: 'info'
};

async function run() {
  const options = {
    ...commonOptions,
    entryPoints: {
      app: path.resolve(appRoot, 'src/main/app.ts'),
      preload: path.resolve(appRoot, 'src/main/preload.ts')
    }
  };

  if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
    return;
  }

  await esbuild.build(options);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
