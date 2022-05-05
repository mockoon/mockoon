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
- _@mockoon/desktop_: the desktop application built with Electron and Angular (for the renderer process)

## Build and run the applications locally during development

Prepare the repository:

1. Clone the repository: `git@github.com:mockoon/mockoon.git`.
2. Install the dependencies and create internal symlinks: `npm run bootstrap`.
3. Build the 2 libraries: `npm run build:libs`.

For the CLI:

- Build the CLI: `npm run build:cli`.
- Test CLI's command by running `./packages/cli/bin/run {command} args` where "command" is a CLI command like `start`, `stop`, etc.

For the desktop application:

- Build the application processes (Electron main and renderer processes) `npm run build:desktop:dev` or with hot reload `npm run build:desktop:dev:watch`.
- Start the application with `npm run start:desktop:dev`.

## Work on your feature or bugfix

- Start your `feature` or `fix` from `main`
- Cover it with automated tests. You will find them in the `test` folders of each package. Please try to cover at least the easiest test cases of your feature.
- Preferably squash your commits, except when it makes sense to keep them separate (one refactoring + feature development)
- Do not forget to add "Closes #xx" in one of the commit messages or in the pull request description (where xx is the GitHub issue number).

Branches naming convention:

- features and enhancements: `feature/{issue_number}-description`
- bug fixes: `fix/{issue_number}-description`

## Adding migrations

When a feature or bugfix requires a change in the data model (`Environment`, `Route`, `RouteResponse`, etc.) you must add a new migration:

- Add a new migration function in the @mockoon/commons library `./packages/commons/src/libs/migrations.ts` file.
- Add a new test for the migration in the same library `./packages/commons/test/data/migrations/{MIGRATION_ID}/environments.json` and `./packages/commons//test/suites/migrations.spec.ts` files.
- Use the script `./packages/desktop/scripts/migrate-tests.js` in the desktop package in order to migrate the tests' `environments.json` samples to the latest migration. Please note that some folders/sample files marked with a `.do-not-update-files` must never be migrated.

## Run the tests

Some unit and integration tests are present in the 4 packages. You can run them with `npm run test` after building the 4 packages:

1. `npm un build:libs`.
2. `npm un build:cli`.
3. `npm un build:desktop:ci`.

These tests will also be run on each commit or pull request in the CI environment.

## Open a pull request

Open a pull request to be merged in the `main` branch. All branches should start from `main` and must be merged into `main`. Ask one maintainer to review the code.

---

## **[Maintainers only]** Build, package and release the applications for production

- Increment the version (which follows [semver](https://semver.org/)) in each package.json file depending on the changes, using `npm run set-versions`. To ignore a package give it the same version. Lerna will take care of increasing the internal dependencies version numbers.
- Push.

**Cli's process:**

Create a `cli-vx.x.x` tag to automatically release the CLI. The libraries and the CLI will be automatically published to NPM.

**Desktop application's process:**

> /!\\ Respect the desktop tag format `vx.x.x` and the GitHub release creation as the desktop application automated update depends on it.

1. Create a `vx.x.x` tag to trigger the build of binaries for the desktop application.
   The desktop Electron application will be packaged using the local symlinked libraries. So, the desktop's release can be independent from the CLI's release.
   The GitHub workflow will automatically package the application for different platforms with `npm run package:win|mac|linux`. Including Windows/macOS code signing and notarization. Code signing is currently managed by @255kb.
   Binaries will be saved as Actions artifacts.

2. Create a GitHub release targeting the `vx.x.x` tag.

> /!\\ Mark the release as a pre-release, and only set it as a final release when all binaries are successfully build, tested and uploaded.

3. Upload the artifacts binaries to the new GitHub release.

4. Publish the release (remove the "pre-release" label).

**Libs process**

There is no release process for the libraries as they are being automatically released together with the CLI, when creating a CLI Git tag.
Releasing the libraries for the desktop application is irrelevant as they are automatically bundled with the binary by electron-builder during the packaging.

## Desktop application distribution

Some manual steps are required in order to properly distribute the application:

- A pull request must be created to update Homebrew Cask repository (update the `version` and the `sha256` hash in the `Casks/mockoon.rb` file and open a PR).
- Binary must be uploaded to the Snap store manually with `snapcraft upload --release=stable ./mockoon-{version}.snap` command.
- Arch Linux repository must be updated (Docker image and script can be used in `./scripts/aur-version-bump`).
- Chocolatey package should be automatically updated after some days.
