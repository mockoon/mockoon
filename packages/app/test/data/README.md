Please migrate all the environments.json sample files when adding a new migration. 
You can use the script in `/scripts/migrate-test.js`.
Please note that some folders/sample files marked with a `.do-not-update-files` must never be migrated.

Reason for migrating the test files: We don't want all the tests to indirectly run the migration scripts.

More information about migrations: https://github.com/mockoon/mockoon/blob/main/CONTRIBUTING.md#adding-migrations