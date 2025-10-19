# Database Overview

The Manga Reader application persists its data in Supabase (PostgreSQL). This document summarises the schema, row-level security (RLS) expectations, and the most common workflows.

## Tables

### `manga`
| Column           | Type          | Notes                                                                 |
| ---------------- | ------------- | --------------------------------------------------------------------- |
| `id`             | `text` PK     | Stable identifier generated client-side (e.g., `manga-...`)          |
| `user_id`        | `uuid`        | Optional reference to `auth.users.id`; `NULL` when using anon access |
| `title`          | `text`        | Human readable name                                                   |
| `slug`           | `text`        | URL-friendly slug (unique per `user_id`)                              |
| `base_url`       | `text`        | Origin domain for image discovery                                     |
| `cover_image`    | `text`        | Optional cover art URL                                                |
| `total_chapters` | `integer`     | Populated after discovery                                             |
| `status`         | `reading_status` enum | `plan`, `reading`, or `done`                             |
| `tags`           | `text[]`      | Custom tags                                                           |
| `last_read`      | `jsonb`       | `{ chapterId, page, timestamp }`                                      |
| `date_added`     | `timestamptz` | Creation time (UTC)                                                   |
| `date_updated`   | `timestamptz` | Updated automatically via trigger                                     |

RLS permits:
- Anonymous role → rows where `user_id IS NULL`
- Authenticated users → rows where `user_id = auth.uid()`

### `chapters`
| Column          | Type          | Notes                                             |
| --------------- | ------------- | ------------------------------------------------- |
| `id`            | `text` PK     | Stable chapter identifier                         |
| `manga_id`      | `text` FK     | References `manga.id`                             |
| `chapter_number`| `integer`     | 1-based chapter index, unique per manga           |
| `title`         | `text`        | Optional override                                 |
| `total_pages`   | `integer`     | Populated after page discovery                    |
| `is_discovered` | `boolean`     | Marks whether all pages are known                 |
| `last_read_page`| `integer`     | Last viewed page (0-indexed)                      |
| `progress`      | `integer`     | 0–100 progress indicator                          |
| `created_at`    | `timestamptz` | Default `now()`                                   |
| `updated_at`    | `timestamptz` | Updated automatically via trigger                 |

RLS mirrors the `manga` table: access is granted when the parent manga row is visible to the caller.

### `pages`
| Column        | Type          | Notes                                            |
| ------------- | ------------- | ------------------------------------------------ |
| `id`          | `text` PK     | Stable page identifier                           |
| `chapter_id`  | `text` FK     | References `chapters.id`                         |
| `page_number` | `integer`     | 0-based position                                 |
| `image_url`   | `text`        | Absolute URL to the image                        |
| `is_cached`   | `boolean`     | Whether the client cached the image locally      |
| `load_error`  | `text`        | Optional error string                            |
| `created_at`  | `timestamptz` | Default `now()`                                  |
| `updated_at`  | `timestamptz` | Updated automatically via trigger                |

RLS follows `chapters`: users may only access pages that belong to chapters they can read.

### `settings`
| Column      | Type          | Notes                                                            |
| ----------- | ------------- | ---------------------------------------------------------------- |
| `id`        | `text` PK     | For the global row we use `global`; authenticated users use `user_id` |
| `user_id`   | `uuid`        | Optional reference to `auth.users.id`                            |
| `data`      | `jsonb`       | Serialized `AppSettings`                                         |
| `created_at`| `timestamptz` | Default `now()`                                                  |
| `updated_at`| `timestamptz` | Updated automatically via trigger                                |

Anonymous access is restricted to the global row; authenticated users can access their own `user_id`.

## Migrations & Seeding

All schema changes live under `supabase/migrations/`. Use the Supabase CLI to apply them locally:

```bash
supabase db reset --seed
```

This command rebuilds the database, runs every migration, and executes `supabase/seed.sql` to populate the default settings.

## Generating TypeScript Types

To refresh the typed client definitions after modifying the schema, run:

```bash
supabase gen types typescript --schema public --project-id <project-ref> --link
```

Update `src/types/database.types.ts` with the generated output to keep the client in sync.
