---
name: Release checklist
about: Checklist for releases (admin use only)
---

- [ ] Bump libs versions
- [ ] Bump serverless version
- [ ] Bump CLI version
- [ ] Bump desktop version
- [ ] Create a **pre-release** (!important) on GitHub with correct version (`v*.*.*`) and publish, for the desktop app
- [ ] Wait for desktop binaries build (automated after pre-release publication)

**Tests:**

- [ ] Manually test desktop binaries (if significant dependencies or native behavior changes)

**Release desktop:**

- [ ] Add desktop binaries to the GitHub release
- [ ] Set the release to final (non pre-release)

**Release the libs (commons, commons-server, serverless, CLI):**

- [ ] Create a `libs-v{YYYY-MM}` tag to release all the NPM libraries

**API:**

- [ ] Update desktop latest version in `/releases/desktop/stable.json`
- [ ] Merge release branch on main

**Website:**

> /!\ Requires above API repo deployment to get an updated desktop version

- [ ] Merge release branch on main (publish the changelogs)
- [ ] Re-run the deployment workflow to update the desktop release version

**Distribution:**

- [ ] Update homebrew cask (PR)
- [ ] Update Snap Store
- [ ] Update Windows Store
- [ ] Update Arch Linux repository
- [ ] Update choco (automated)

**Misc:**

- [ ] Close / update Github issues
- [ ] Clean 'Roadmap' project
- [ ] Spread the word!
