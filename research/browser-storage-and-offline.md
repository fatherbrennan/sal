# Browser storage and offline boundaries

Source bodies checked 23 October 2026. These are platform findings and proposed acceptance
boundaries, not implemented storage or offline support. IndexedDB, automatic saving, JSON
backups and offline operation are already approved in [product decisions](product-decisions.md).

## Verified platform facts

| Source                                                                                                                  | Inspected section                                                   | Finding                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Indexed Database API 3.0](https://www.w3.org/TR/2025/WD-IndexedDB-3-20250813/)                                         | Working Draft dated 13 August 2025; sections 2.7.1, 4.3 and 5.4–5.5 | A successful request is not transaction commitment. `complete` follows commitment; abort rolls back transaction changes. Transactions become inactive outside the specified event/task lifecycle. A higher-version open can remain blocked by other connections; opening an older version fails. This is a draft contract, requiring browser verification. |
| [MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | Persistence, private browsing, quota and eviction sections          | Browser storage is normally best-effort. IndexedDB and Cache storage can be evicted; private-session data is usually removed when that session ends. Quotas vary by browser and storage is normally scoped to the origin, including its port. No universal capacity or retention duration follows.                                                         |
| [MDN `StorageManager.persist()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)               | Return value, exceptions and secure-context requirement             | The request can return false or fail. A grant changes storage persistence; it does not create an external backup or prevent deliberate browser-data deletion. A request must not be presented as a successful grant.                                                                                                                                       |
| [SvelteKit service workers](https://svelte.dev/docs/kit/service-workers)                                                | Registration and imports                                            | The current guide supports `src/service-worker/index.ts`, `$app/service-worker`, `$app/env` and `$app/manifest`. The manifest exposes immutable, asset and prerendered resources. This is a framework route to asset caching, not proof that sal currently works offline. Verify the installed version's declarations before implementation.               |

## Consequences for sal

- A committed IndexedDB transaction is the success boundary for the approved “saved” status.
  A successful individual write followed by an abort must remain an error.
- Validate a complete backup and resolve conflicts before its write transaction. Apply all
  related records atomically; preserve existing records if the transaction fails.
- Keep financial records and preferences in IndexedDB. Browser asset caches serve only the
  approved offline application resources; a cached app is not a backup of its records.
- Handle blocked upgrades, failed migrations and unavailable storage explicitly. Clearing the
  database is not an acceptable automatic recovery for a schema or connection error.
- Treat a new deployment origin as a different storage location. The approved JSON export/import
  provides a portable copy; ordinary browser storage does not transfer itself to that origin.

These are proposed implementation boundaries derived from the platform contracts and approved
data-preservation requirements. They do not choose a schema, migration algorithm or interface.

## Verification still required

Actual Chrome, Edge and Firefox tests must distinguish request success from committed save,
verify rollback and backup round-trips, and exercise two-tab upgrade blocking. Controlled
failures must retain edits and expose an error; test doubles alone do not prove persistence.

Offline acceptance must cover initial asset installation followed by offline reload, navigation
and calculations, including resources not previously visited. Interrupted updates must preserve
the usable version and stored records. Service-worker execution needs verified coverage before
it enters the strict gate; current page coverage does not measure workers.

The user selected restorable archives that preserve existing comparisons, conflict resolution
showing both versions when tabs edit the same offer, and update notifications followed by a
user-chosen reload after saving. Request persistent-storage protection after the first successful
save and report the actual outcome. JSON backups remain independent of browser protection.
