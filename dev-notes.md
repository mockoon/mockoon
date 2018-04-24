# Publish a new version

- `npm run setversion x.x.x`
- update app menu changelog link and title
- `npm run build:app`
- `npm run package:win|mac|linux` alternatively
- `npm run publish:win|mac|linux|file|all` -> will upload specific file(s) together with updates.json (do not forget that if updates.json is bumped you need to upload everything!), or upload one by one and then updates.json

- Update 'mockoon-website' download links.

- Create release in 'mockoon' repository.

- tweet

# Changes made to webpack configs

- added `externals` array
- corrected windows generated path when ejecting from `xxx\\xxx` to `xxx/xxx`
- remove uglify in prod build because of incompatible libs
