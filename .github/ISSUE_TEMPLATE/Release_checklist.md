---
name: Release checklist
about: Checklist for releases (admin use only)

---

- [ ] Bump app version

**Builds:**
- [ ] Build and sign Windows binary
- [ ] Build Linux binaries (deb, rpm, snap, AppImage)
- [ ] Build OSX binary (dmg)

**Tests:**
- [ ] Test Windows binary
- [ ] Test Linux binary(ies)
- [ ] Test OSX binary

**Release:**
- [ ] Create release on repository with correct version and tag
- [ ] Add Windows binaries to release
- [ ] Add Linux binaries to release
- [ ] Add OSX binaries to release
- [ ] Publish release

**Website:**
- [ ] Update website versions
- [ ] Publish website on Firebase

**Distribution:**
- [ ] Update homebrew cask
- [ ] Update Snap Store
- [ ] Update Arch Linux repository
- [ ] Update choco

**Misc:**
- [ ] Close / update Github issues
- [ ] Clean 'Roadmap' project
- [ ] Spread the word!
