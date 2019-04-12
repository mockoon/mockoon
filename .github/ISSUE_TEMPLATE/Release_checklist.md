---
name: Release checklist
about: Checklist for releases (admin use only)

---
- [ ] Rename milestone to version number
- [ ] Add version in migration comment
- [ ] Bump app version

**Builds:** 
- [ ] Build and sign Windows version
- [ ] Build Linux version
- [ ] Build OSX version

**Tests:**
- [ ] Test Windows build
- [ ] Test Linux build
- [ ] Test OSX build

**Release:**
- [ ] Create release on repository with correct version and tag
- [ ] Add Windows binaries to release
- [ ] Add Linux binaries to release
- [ ] Add OSX binaries to release
- [ ] Publish release

**Website:**
- [ ] Update website versions
- [ ] Merge website branch
- [ ] Publish website on Firebase

**Distribution:**
- [ ] Update homebrew cask
- [ ] Update choco

**Misc:**
- [ ] Close / update Github issues
- [ ] Clean 'Next release' project
- [ ] Spread the word!
