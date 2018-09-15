# Publish a new version

1. `npm run setversion x.x.x`
2. update app menu changelog link and title
3. `npm run build:app`
4. `npm run package:win|mac|linux` alternatively
5. Create release in 'mockoon' repository.

New way:
6. Add built binaries to a new GitHub release. (Respect release tag format `vx.x.x`)

Old way:
6. `npm run publish:win|mac|linux|file|all` -> will upload specific file(s) together with updates.json (do not forget that if updates.json is bumped you need to upload everything!), or upload one by one and then updates.json

7. Update 'mockoon-website' download links (point to GitHub release).

# Changes made to webpack configs

- added `externals` array
- corrected windows generated path when ejecting from `xxx\\xxx` to `xxx/xxx`
- remove uglify in prod build because of incompatible libs
