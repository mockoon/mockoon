# Contributing to Mockoon

There are many ways to contribute to Mockoon: opening bugs or issues, submitting pull requests, suggesting new features, etc. All contributions are welcome but, please note that Mockoon promise is to be simple, easy to use, and fast. So, not all features are worth implementing and the maintainers may choose not to implement features that are out of Mockoon's scope, too complicated (especially UX wise) or, that didn't gather enough attention from the community. But we are open to discussion :)

You can always discuss your ideas or ask for support on the [official community](https://github.com/mockoon/mockoon/discussions).

## Contribution rules

The following rules apply to all contributions:

- Always search among the opened and closed issues. Assigned issues are already being worked on, and, most of the time, cannot be reassigned.
- Bug reports, enhancements, and features **must** be discussed with the maintainers regarding the implementation, changes to the UI, etc.
- Pull requests **must** refer to an open issue. Pull requests not solving existing issues may not be accepted.
- Issues and PR **must** follow the provided templates.

## Find an issue to work on

- Check for **opened unassigned** issues or open a new one (after searching for closed issues).
- If you are not the issue creator, comment on the issue and request to work on it so it can be assigned to you.
- After discussing the implementation, the issue will be assigned to you by a maintainer. As a rule, the assignee is the person working on the issue.

Please respect this workflow to ensure that:

- Your work is in line with Mockoon roadmap.
- It hasn't been already done/rejected.
- There is only one person at a time working on an issue.

## Monorepo

Mockoon is using a monorepo setup (with Lerna). We have 4 packages in the `./packages/` folder:

**Libraries** used by the desktop application and the CLI:

- _@mockoon/commons_: this library contains mostly typings, utils and migrations designed to be used in both the browser and Node.js environments. Thus, it is safe to use in the desktop Electron's main or renderer processes, and the CLI.
- _@mockoon/commons-server_: this library contains mostly "server side" code designed to be used in a Node.js environment. Thus, it is safe to use it in the desktop application Electron's main process and the CLI, but **not** in the desktop application Electron's renderer process.

**Applications**:

- _@mockoon/cli_; the CLI built with Oclif
- _@mockoon/serverless_; the package to run Mockoon as a serverless function (AWS lambda, etc.)
- _@mockoon/desktop_: the desktop application built with Electron and Angular (for the renderer process)

## Build and run the applications locally during development

Prepare the repository:

1. Clone the repository: `git@github.com:mockoon/mockoon.git`.
2. Install the dependencies and create internal symlinks: `npm run bootstrap`.
3. Build the 2 libraries: `npm run build:libs`. You can also build them in watch mode with `npm run build:libs:watch`.

For the CLI:

- Build the CLI: `npm run build:cli`.
- Test CLI's command by running `./packages/cli/bin/run {command} args` where "command" is a CLI command like `start`, `stop`, etc.

For the desktop application:

- Build the application processes (Electron main and renderer processes) `npm run build:desktop:dev` or in watch mode `npm run build:desktop:dev:watch`.
- Start the application with `npm run start:desktop:dev`. The application will restart automatically when you make changes to the `commons` or `commons-server` libraries or to the desktop application's code.

### VSCode remote debugging

To debug the desktop application, you can use the VSCode launch configuration `Desktop: All processes` (You need to stop the `npm run start:desktop:dev` command). It will start the application in debug mode and attach the debugger to it. You will then be able to set breakpoints in VSCode on the desktop application's code and on the libraries code (`commons` or `commons-server`).

## Work on your feature or bugfix

- Start your `feature` or `fix` from `main`
- Cover it with automated tests. You will find them in the `test` folders of each package. Please try to cover at least the easiest test cases of your feature.
- Preferably squash your commits, except when it makes sense to keep them separate (one refactoring + feature development)
- Do not forget to add "Closes #xx" in one of the commit messages or in the pull request description (where xx is the GitHub issue number).

Branches naming convention:

- features and enhancements: `feature/{issue_number}-description`
- bug fixes: `fix/{issue_number}-description`
- chores: `chore/{issue_number}-description`

## Adding migrations

When a feature or bugfix requires a change in the data model (`Environment`, `Route`, `RouteResponse`, etc.) you may have to add a new migration:

- Add a new migration function in the @mockoon/commons library `./packages/commons/src/libs/migrations.ts` file.
- Add a new test for the migration in the same library `./packages/commons/test/data/migrations/{MIGRATION_ID}/environments.json` and `./packages/commons//test/suites/migrations.spec.ts` files.
- Use the script `./packages/desktop/scripts/migrate-tests.js` in the desktop package in order to migrate the tests' JSON samples (usually located in `./packages/{package_name}/test/data/...`) to the latest migration. Please note that some folders/sample files are excluded from the migration on purpose.

Some data model changes may not require a migration, for example, adding a new choice in an enum (translated in the UI by a dropdown).

> ⚠️ All data model changes must be release in a **major** version. In any case, please discuss the migration with the maintainers.

## Lint and format

ESLint rules and Prettier code styling are enforced by the continuous integration pipeline. Please fix all the ESLint issues and format your code using Prettier before pushing.

## Run the tests

Some unit and integration tests are present in the 4 packages. First you need to build the following 4 packages:

1. `npm run build:libs`.
2. `npm run build:serverless`.
3. `npm run build:cli`.
4. `npm run build:desktop:ci`.

After the packages are build, you can run the tests necessary to your changes:

- `npm run test:commons`
- `npm run test:commons-server`
- `npm run test:libs` (includes `commons` and `commons-server`)
- `npm run test:serverless`
- `npm run test:cli`

To run the desktop application tests, first you need to package the application for your platform. Run one of the following commands:

- `package:desktop:test:win`
- `package:desktop:test:mac`
- `package:desktop:test:linux`

This will create a packaged version of the desktop application (without installer) in the `./packages/desktop/packages/{win-unpacked|mac|linux-unpacked}` folder.

You can then run the tests with one of the following commands:

- `test:desktop:win`
- `test:desktop:mac`
- `test:desktop:linux`

You can also run a single test file with the following commands (from the monorepo root level):

- `npm run test:desktop:{win|mac|linux} -- -- --spec "filename.spec.ts"`

All tests will also be run on each commit or pull request in the CI environment. You can perfectly rely on the CI to check if your changes are breaking the tests or not.

> ℹ️ Note: Since update v7.0.0 where dependencies were updated (especially Webdriverio and Electron 29), running the desktop tests against an unpackaged version of the application using the `node_modules` binary (e.g. `node_modules/.bin/electron app=dist/app.js`) is not working anymore.

## Open a pull request

Open a pull request to be merged in the `main` branch. All branches should start from `main` and must be merged into `main`. Ask one maintainer to review the code.

---

## **[Maintainers only]** Build, package and release the applications for production

- Increment the version (which follows [semver](https://semver.org/)) in each package.json file depending on the changes, using `npm run set-versions`. To ignore a package give it the same version. Lerna will take care of increasing the internal dependencies version numbers.
- Push.

> Versions are synchronized between the desktop application, CLI and the libraries. We release all of them at the same time with a **major** version bump when a data migration is included in the relase, or when new common features are added (common = feature working in both desktop and CLI). The libraries can be released independently from the desktop application for minor and patch versions when the changes are only affecting the libraries.

**Desktop application's process:**

> /!\\ Respect the desktop tag format `vx.x.x` and the GitHub release creation as the desktop application automated update depends on it.

1. Create a GitHub release targeting the `vx.x.x` tag.

> /!\\ Mark the release as a pre-release, and only set it as a final release when all binaries are successfully build, tested and uploaded. Otherwise, it will trigger the auto-update for versions <1.19.0.

The desktop Electron application will be packaged using the local symlinked libraries. So, the desktop's release can be independent from the libraries release.
The GitHub workflow will automatically package the application for different platforms with `npm run package:win|mac|linux`. Including Windows/macOS code signing and notarization. Code signing is currently managed by @255kb.
Binaries will be saved as Actions artifacts.

2. Manually test the binaries if needed (changes not covered by automated tests).

3. Upload the artifacts binaries to the new GitHub release.

4. Publish the release (remove the "pre-release" label).

**Libs' process (commons, commons-server, serverless, CLI):**

Create a `libs-vx.x.x` tag to automatically release all the libraries on NPM (commons, commons-server, serverless, CLI).

> /!\\ Do not create a **GitHub release** for the libs, as desktop versions <=1.19.0 relies on https://api.github.com/repos/mockoon/mockoon/releases/latest to get the latest release version. As we are using a monorepo, this would mess up the legacy auto update from the desktop application.

### Building the desktop application locally in production mode

To build the desktop application locally in production mode, you can use the following commands:

- `npm run build:libs` to build the libraries.
- `npm run build:desktop:prod` to build the application processes (Electron main and renderer processes).
- `npm run package:desktop:win` to package the application for Windows.
- Or `npm run package:desktop:mac:unsigned` to package the application for macOS.
- Or `npm run package:desktop:linux` to package the application for Linux.

This will create a packaged version of the desktop application in the `./packages/desktop/packages/` folder.

> 💡 Note: Code signing should be ignored on Windows when building locally. For macOS, the command `npm run package:desktop:mac:unsigned` will create an unsigned package, ignoring code signing and notarization.

## Desktop application distribution

Some manual steps are required in order to properly distribute the application:

- the API repository (private) desktop release files must be updated. This will update the download links on the website.
- A pull request must be created to update Homebrew Cask repository (update the `version` and the `sha256` hash in the `Casks/mockoon.rb` file and open a PR).
- Binary must be uploaded to the Snap store manually with `snapcraft upload --release=stable ./mockoon-{version}.snap` command.
- Arch Linux repository must be updated (Docker image and script can be used in `./scripts/aur-version-bump`).
- Chocolatey package should be automatically updated after some days.
