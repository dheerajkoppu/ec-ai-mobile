# Database

EC-AI uses one Neon Postgres database. The repo has no migrations, so this page
is the reference for what the tables look like. It was generated from the live
database's `information_schema` on 2026-10-12. Update it when the schema changes.

Queries are written as raw SQL through the `sql` helper in `lib/db.ts`.

## How the tables relate

- `users.clerk_id` is the key the API uses. It comes from the verified Clerk token, never from the request body.
- `activities` belongs to a user and carries both `user_id` and `clerk_id`. `hours_logged` belongs to an activity.
- `user_saved_opportunities` and `user_swipes` link a user to rows in `opportunities`.
- `user_push_tokens` and `user_notification_history` support push alerts. They have no foreign keys.

Deleting a `users` row cascades to that user's activities, logged hours, saved
opportunities and swipes. It does not remove their push tokens, notification
history or opportunity reports.

## Things worth knowing

- `users.gpa_weighted` and `users.gpa_unweighted` are `numeric(3,2)`, so the largest value they hold is 9.99. The profile route rejects anything higher.
- `users.sat_score`, `act_score` and `psat_score` are text. They hold the lower bound of the range the student picked, or null for none. Before validation was added, a score of None was written as the text `NaN`.
- `users.career_interest` is text that holds a Postgres array literal such as `{STEM,Law}`. `lib/recommendationScore.ts` parses it.
- `opportunities.hours_per_week` and the `min_*` columns are text, not numbers.
- `user_push_tokens` and `user_notification_history` are created at runtime by `ensurePushNotificationInfrastructure` in `lib/pushNotifications.server.ts`.
- `user_swipes` has no index on `user_clerk_id`. The recommendations query filters on it, so add one as the table grows.

## User data

### `users`

| Column                             | Type         | Null | Default                             |
| ---------------------------------- | ------------ | ---- | ----------------------------------- |
| `id`                               | integer      | no   | `nextval('users_id_seq'::regclass)` |
| `name`                             | varchar(100) | no   |                                     |
| `email`                            | varchar(100) | no   |                                     |
| `clerk_id`                         | varchar(50)  | no   |                                     |
| `age`                              | integer      | yes  |                                     |
| `grade_level`                      | text         | yes  |                                     |
| `gender`                           | text         | yes  |                                     |
| `race_ethnicity`                   | text         | yes  |                                     |
| `school_name`                      | text         | yes  |                                     |
| `city`                             | text         | yes  |                                     |
| `state`                            | text         | yes  |                                     |
| `free_reduced_lunch`               | boolean      | yes  |                                     |
| `first_gen_college`                | boolean      | yes  |                                     |
| `gpa_weighted`                     | numeric(3,2) | yes  |                                     |
| `gpa_unweighted`                   | numeric(3,2) | yes  |                                     |
| `sat_score`                        | text         | yes  |                                     |
| `act_score`                        | text         | yes  |                                     |
| `psat_score`                       | text         | yes  |                                     |
| `career_interest`                  | text         | yes  |                                     |
| `wants_to_start_business`          | boolean      | yes  |                                     |
| `interested_in_research`           | boolean      | yes  |                                     |
| `extracurricular_motivation`       | text[]       | yes  |                                     |
| `field_goal`                       | text         | yes  |                                     |
| `seeking_leadership`               | boolean      | yes  |                                     |
| `open_to_own_project`              | boolean      | yes  |                                     |
| `opportunity_selectivity`          | text         | yes  |                                     |
| `interested_in_paid_opportunities` | boolean      | yes  |                                     |
| `interested_in_travel`             | boolean      | yes  |                                     |
| `weekly_commitment`                | text         | yes  |                                     |
| `extracurricular_format`           | text         | yes  |                                     |
| `currently_in_extracurriculars`    | boolean      | yes  |                                     |
| `extracurricular_types`            | text[]       | yes  |                                     |
| `held_leadership`                  | boolean      | yes  |                                     |
| `leadership_details`               | text         | yes  |                                     |
| `skills`                           | text[]       | yes  |                                     |
| `has_notable_achievements`         | boolean      | yes  |                                     |
| `achievements_details`             | text         | yes  |                                     |
| `competed_in_competitions`         | boolean      | yes  |                                     |
| `competitions_details`             | text         | yes  |                                     |
| `referral_source`                  | text         | yes  |                                     |
| `used_other_ec_finders`            | boolean      | yes  |                                     |
| `interested_in_beta_features`      | boolean      | yes  |                                     |
| `profile_picture_url`              | text         | yes  |                                     |
| `wants_notifications`              | boolean      | yes  |                                     |
| `agreed_to_terms`                  | boolean      | yes  | `false`                             |
| `created_at`                       | timestamptz  | yes  | `CURRENT_TIMESTAMP`                 |
| `last_active_at`                   | timestamptz  | yes  |                                     |
| `last_engagement_email_at`         | timestamptz  | yes  |                                     |

Constraints:

- `PRIMARY KEY (id)`
- `UNIQUE (clerk_id)`
- `UNIQUE (email)`

Indexes:

- `idx_users_engagement_candidates ON users USING btree (last_engagement_email_at, last_active_at) WHERE (email IS NOT NULL)`

### `activities`

| Column           | Type      | Null | Default                                  |
| ---------------- | --------- | ---- | ---------------------------------------- |
| `id`             | integer   | no   | `nextval('activities_id_seq'::regclass)` |
| `user_id`        | integer   | no   |                                          |
| `name`           | text      | no   |                                          |
| `activity_type`  | text      | no   |                                          |
| `hours_per_week` | numeric   | yes  |                                          |
| `weeks_per_year` | numeric   | yes  |                                          |
| `roles`          | text      | yes  |                                          |
| `description`    | text      | yes  |                                          |
| `grades`         | text      | yes  |                                          |
| `created_at`     | timestamp | yes  | `CURRENT_TIMESTAMP`                      |
| `clerk_id`       | text      | no   |                                          |

Constraints:

- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `PRIMARY KEY (id)`

Indexes:

- `activities_clerk_id_idx ON activities USING btree (clerk_id)`

### `hours_logged`

| Column             | Type         | Null | Default                                    |
| ------------------ | ------------ | ---- | ------------------------------------------ |
| `id`               | integer      | no   | `nextval('hours_logged_id_seq'::regclass)` |
| `activity_id`      | integer      | no   |                                            |
| `date_of_activity` | date         | no   |                                            |
| `hours_logged`     | numeric(5,2) | no   |                                            |
| `description`      | text         | yes  |                                            |
| `user_id`          | text         | no   |                                            |

Constraints:

- `FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE`
- `PRIMARY KEY (id)`

### `user_saved_opportunities`

| Column           | Type        | Null | Default             |
| ---------------- | ----------- | ---- | ------------------- |
| `clerk_id`       | varchar(50) | no   |                     |
| `opportunity_id` | integer     | no   |                     |
| `saved_at`       | timestamptz | yes  | `CURRENT_TIMESTAMP` |

Constraints:

- `FOREIGN KEY (clerk_id) REFERENCES users(clerk_id) ON DELETE CASCADE`
- `FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE`
- `PRIMARY KEY (clerk_id, opportunity_id)`

### `user_swipes`

| Column           | Type        | Null | Default                                   |
| ---------------- | ----------- | ---- | ----------------------------------------- |
| `id`             | integer     | no   | `nextval('user_swipes_id_seq'::regclass)` |
| `user_clerk_id`  | varchar(50) | no   |                                           |
| `opportunity_id` | integer     | no   |                                           |
| `liked`          | boolean     | no   |                                           |
| `created_at`     | timestamptz | yes  | `CURRENT_TIMESTAMP`                       |

Constraints:

- `FOREIGN KEY (user_clerk_id) REFERENCES users(clerk_id) ON DELETE CASCADE`
- `PRIMARY KEY (id)`

### `reported_opportunities`

| Column           | Type        | Null | Default                                              |
| ---------------- | ----------- | ---- | ---------------------------------------------------- |
| `id`             | integer     | no   | `nextval('reported_opportunities_id_seq'::regclass)` |
| `clerk_id`       | text        | no   |                                                      |
| `opportunity_id` | integer     | no   |                                                      |
| `reason`         | text        | no   |                                                      |
| `details`        | text        | yes  |                                                      |
| `reported_at`    | timestamptz | yes  | `now()`                                              |

Constraints:

- `PRIMARY KEY (id)`

## Opportunities

Rows are loaded with `npm run import:opportunities`, which is a dry run unless `--apply` is passed.

### `opportunities`

| Column                 | Type         | Null | Default                                     |
| ---------------------- | ------------ | ---- | ------------------------------------------- |
| `id`                   | integer      | no   | `nextval('opportunities_id_seq'::regclass)` |
| `school`               | varchar(255) | yes  |                                             |
| `activity_name`        | varchar(255) | yes  |                                             |
| `career_field`         | varchar(255) | yes  |                                             |
| `activity_type`        | varchar(255) | yes  |                                             |
| `location`             | varchar(50)  | yes  |                                             |
| `duration`             | varchar(50)  | yes  |                                             |
| `deadline`             | date         | yes  |                                             |
| `application_link`     | text         | yes  |                                             |
| `grade_requirements`   | text[]       | yes  |                                             |
| `race_requirements`    | text[]       | yes  |                                             |
| `gender_requirements`  | text[]       | yes  |                                             |
| `age_requirements`     | text[]       | yes  |                                             |
| `primary_city`         | varchar(255) | yes  |                                             |
| `only_frl_students`    | boolean      | yes  |                                             |
| `only_first_gen`       | boolean      | yes  |                                             |
| `min_gpa`              | varchar(10)  | yes  |                                             |
| `min_sat`              | varchar(10)  | yes  |                                             |
| `min_act`              | varchar(10)  | yes  |                                             |
| `min_psat`             | varchar(10)  | yes  |                                             |
| `has_leadership_roles` | boolean      | yes  |                                             |
| `selectivity_level`    | varchar(50)  | yes  |                                             |
| `outside_us`           | boolean      | yes  |                                             |
| `hours_per_week`       | varchar(20)  | yes  |                                             |
| `created_at`           | timestamp    | yes  | `CURRENT_TIMESTAMP`                         |
| `description`          | varchar(500) | yes  |                                             |
| `pictureurl`           | text         | yes  |                                             |
| `prestige`             | integer      | yes  |                                             |

Constraints:

- `PRIMARY KEY (id)`

## Push notifications

### `user_push_tokens`

| Column            | Type        | Null | Default                                        |
| ----------------- | ----------- | ---- | ---------------------------------------------- |
| `id`              | bigint      | no   | `nextval('user_push_tokens_id_seq'::regclass)` |
| `clerk_id`        | text        | no   |                                                |
| `expo_push_token` | text        | no   |                                                |
| `platform`        | text        | yes  |                                                |
| `is_active`       | boolean     | no   | `true`                                         |
| `last_seen_at`    | timestamptz | no   | `now()`                                        |
| `created_at`      | timestamptz | no   | `now()`                                        |
| `updated_at`      | timestamptz | no   | `now()`                                        |

Constraints:

- `PRIMARY KEY (id)`
- `UNIQUE (expo_push_token)`

### `user_notification_history`

| Column              | Type        | Null | Default                                                 |
| ------------------- | ----------- | ---- | ------------------------------------------------------- |
| `id`                | bigint      | no   | `nextval('user_notification_history_id_seq'::regclass)` |
| `clerk_id`          | text        | no   |                                                         |
| `notification_type` | text        | no   |                                                         |
| `dedupe_key`        | text        | no   |                                                         |
| `sent_at`           | timestamptz | no   | `now()`                                                 |
| `created_at`        | timestamptz | no   | `now()`                                                 |

Constraints:

- `PRIMARY KEY (id)`
- `UNIQUE (clerk_id, notification_type, dedupe_key)`

## Lookup tables

These hold the choices shown in dropdowns. Each has an integer `id` primary key and the columns below, except `y-n`, which is keyed by `code`. The routes cache them for 24 hours.

| Table                     | Columns                        | Read by                       |
| ------------------------- | ------------------------------ | ----------------------------- |
| `activitytypes`           | `name` (unique)                | `getactivitytypes`            |
| `career_interest`         | `career_interest`              | `fetchdropdowns`, `questions` |
| `cities`                  | `city_name`                    | `questions`                   |
| `extracurricular_format`  | `format`                       | `fetchdropdowns`, `questions` |
| `extracurricular_reasons` | `reason`                       | `fetchdropdowns`, `questions` |
| `field_level`             | `level`                        | `fetchdropdowns`, `questions` |
| `gender`                  | `gender`                       | `fetchdropdowns`, `questions` |
| `grades`                  | `grade_level`                  | `fetchdropdowns`, `questions` |
| `opportunity_selectivity` | `selectivity`                  | `fetchdropdowns`, `questions` |
| `race_ethnicity`          | `race_ethnicity`               | `fetchdropdowns`, `questions` |
| `referral_source`         | `source`                       | `fetchdropdowns`, `questions` |
| `school_name`             | `school_name`                  | `questions`                   |
| `weekly_commitment`       | `commitment`                   | `fetchdropdowns`, `questions` |
| `sat_range`               | `range_text`                   | `fetchdropdowns`              |
| `act_range`               | `range_text`                   | `fetchdropdowns`              |
| `psat_range`              | `range_text`                   | `fetchdropdowns`              |
| `gpa_range`               | `range_text`                   | none                          |
| `questions`               | `question`, `page_number`      | `questions`                   |
| `y-n`                     | `code` (primary key), `option` | `fetchdropdowns`, `questions` |
