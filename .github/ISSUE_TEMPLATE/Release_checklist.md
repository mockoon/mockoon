---
name: Release checklist
about: Checklist for releases (maintainers use only)
---

**Tests:**

- [ ] Manually test desktop binaries (if significant dependencies or native behavior changes)

**Versions:**

- [ ] Bump packages versions

**Release the libs (commons, commons-server, cloud, serverless, CLI):**

- [ ] Create a `libs-v{x.x.x}` tag to release all the NPM libraries

**Release desktop:**

- [ ] Create a **pre-release** (!important) on GitHub with correct version (`v*.*.*`) and publish, for the desktop app
- [ ] Wait for desktop binaries build (automated after pre-release publication)
- [ ] Add desktop binaries to the GitHub release
- [ ] Set the release to final (non pre-release)

**Website (publish changelogs):**

- [ ] Merge release branch on main (publish the changelogs)

**API:**

- [ ] Update desktop latest version in `/releases/desktop/stable.json`
- [ ] Merge release branch on main
- [ ] Wait for deployment and purge cache on CF

**Sync server:**

- [ ] Re-deploy after libs release and API update

**Website (update desktop version):**

> /!\ Requires above API repo deployment to get an updated desktop version

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
