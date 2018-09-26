# Build and publish a new version

1. `npm run setversion x.x.x`
2. `npm run build:app`
3. `npm run package:win|mac|linux` alternatively
4. Create release in GitHub 'mockoon' repository. (Respect release tag format `vx.x.x`)
5. Add binaries to the new GitHub release. 
6. Update 'mockoon-website' download links (point to GitHub release).
