# install nvm, Node, npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install v14.20.1
nvm alias default v14.20.1
#npm install -g npm

# build Mockoon cli
npm run bootstrap
npm run build:libs
npm run build:cli
ln -s `pwd`/packages/cli/bin/run ~/bin/mockoon-cli

# set up Python and test dir
brew update && brew upgrade pyenv
pyenv install 3.8.9
pyenv virtualenv 3.8.9 mockoon
pyenv local mockoon
python -m pip install --upgrade pip
pip install -r test/requirements.txt
pytest

# run mock resource tests
mockoon-cli start --data test/models-api.json
pytest
mockoon-cli stop 0

# build and start Mockoon desktop
npm run build:desktop:dev
#npm run build:desktop:dev:watch       ## hangs for me!
npm run start:desktop:dev

# run all unit and integration tests
npm run build:desktop:ci
#npm run test      ## hangs for me!

# after changing files
npm run lint && npm run test:commons-server && npm run build:libs

# when done
npm install typescript && npm install
npm run format:write

# limit unit tests
vi packages/commons-server/package.json
  - "test": "ts-mocha                        <other options...>",
  + "test": "ts-mocha --grep 'mock resource' <other options...>",
