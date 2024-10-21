## Shared ESLint Config

This folder contains the shared ESLint configuration for the project. It is used as-is by most packages in the project (cli, cloud, serverless, commons, commons-server). It is also used by the desktop package, but with some additional rules. Notably, the desktop package adds Angular specific rules, and disable some strict rules that are currently generating too many errors (the desktop package was started without strict mode).
