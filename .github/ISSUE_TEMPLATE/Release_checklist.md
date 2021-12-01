---
name: Release checklist
about: Checklist for releases (admin use only)
---

- [ ] Bump app version
- [ ] Create a **pre-release** (!important) on GitHub with correct version and publish
- [ ] Build the binaries (automated after pre-release publication)

**Tests:**

- [ ] Test Windows binaries
- [ ] Scan Windows exe installer binary on VirusTotal
- [ ] Test Linux binaries
- [ ] Test OSX binaries

**Release:**

- [ ] Add Windows binaries to release
- [ ] Add Linux binaries to release
- [ ] Add OSX binaries to release
- [ ] Set the release to final (non pre-release)

**Website:**

- [ ] Update website package version
- [ ] Merge release branch on main

**CLI (if applicable):**

- [ ] Merge release branch on main
- [ ] Create release

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
