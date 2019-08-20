# Contributing to Mockoon

There are many ways to contribute to Mockoon: opening bugs or issues, submitting pull requests, suggesting new features...

Before contributing please check the opened and unassigned issues. Any pull request should link to an opened issue. Pull requests not solving issues may not be accepted.
If you want to contribute significant changes please discuss with the maintainers before starting to work.
Please note that Mockoon promise is to be simple, easy to use, and fast. So not all features are worth implementing and maintainer may chose to not implement features that are out of Mockoon's scope.

> Prerequisites:
> - Node.js ^10.x.x

### Run the application in dev mode

- Clone the repository: `git@github.com:mockoon/mockoon.git`
- Run `npm install`.
- Run `npm run serve:app` then `npm run serve:electron` when the first command finish (`dist` folder must be available for Electron). Or directly run `npm run serve` which will run both commands in a row.

You will get hot reload on both Angular and Electron applications.

### Work on your feature or bugfix

- Start your `feature` or `fix` from `master`
- Add some spectron tests. You will find them in the `test` folder. Please try to cover at least the easiest test cases of your feature. 
- Preferably squash your commits, except when it makes sense to keep them separate (one refactoring + feature development)
- Do not forget to add "Closes #xx" in one of the commit messages (where xx is the GitHub issue number)

Branches naming convention:
- features and enhancements: `feature/name-or-issue-number`
- bug fixes: `fix/name-or-issue-number`

### Run the tests

Tests are written with Spectron and you can run them using `npm run test`. These tests will also be run on each commit or pull request by CircleCI.

When running the tests locally, you will first need to run `npm run build:dev` in order to have an application build to test against.

### Open a pull request

Open a pull request to be merge in the `master` branch. All branches should start from `master` and must be merged into `master`. 
Ask maintainers to review the code and be prepared to rework your code if it does not match the style or do not follow the way it's usually done. 

---

## Maintainers only

### Build and package the application for production

- Increment the version in package.json files. Use `npm run setversion x.x.x`.
- Run `npm run build:prod`.
- Package the application for different platforms with `npm run package:win|mac|linux`.
- Create a release in GitHub 'mockoon' repository. (Respect release tag format `vx.x.x`)
- Add binaries to the new GitHub release.

You will get a packaged application in `./packages` folder.
Mac version can only be built and signed on Mac OS.

Note that Windows and Mac OS versions need to be signed when packaged. This is the responsibility of maintainers (see below).

/!\ Auto update depends on GitHub release proper taging (`vx.x.x`) and binaries correct naming (as set in `package.json` and `update.service.ts`). Do not change them.

### Distribute the application

Only maintainers are entitled to build and package the application with Windows code signing and Mac OS certificates.

Do not forget to update Homebrew cask repository.
Chocolatey package should be automatically updated.
