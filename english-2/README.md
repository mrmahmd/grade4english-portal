# AlAndalus English Primary 2

Static English-only Grade 2 curriculum, served from `/english-2/` inside `mrmahmd/grade4english-portal`.

## Content

The supplied `English_Primary_2_Professional_Stations_Website.zip` is the content source. Its `js/data.js` is preserved unchanged: six units, 24 lessons, 600 lesson questions, 180 unit questions and 100 review questions. The supplied Ministry textbook is the 2025/2026 Term 1 edition. The original project contains adapted practice passages and additional exercises; this is not a page-for-page digital reproduction of the textbook. No textbook PDF is published.

Each lesson has Words, Discover, Sounds, Read & listen, Write, and Play & practise stations. Lesson challenges require 70% to unlock the next lesson. Review results do not inflate the completed-lesson count. Each correct question awards points only once. Written work is saved without claiming automatic language grading. Listening uses the browser's available English speech voice.

## Accounts and saving

- Uses the same Supabase project as the existing AlAndalus portal.
- Validates the authenticated user, then reads the Grade 2 profile before opening the application.
- Stores progress in existing `public.course_progress`, keyed by `(user_id, app_id)` with `app_id = english2-term1`.
- Keeps a user-specific local copy; never imports anonymous progress into another student's account.
- Merges correct-answer IDs, completed stations, best scores, and timestamped writing/activity. Cloud writes use an `updated_at` comparison to retry competing writes instead of blindly replacing another session's progress.
- Portal entry opens the home screen. Continue last activity restores the saved station/question; a refresh restores the current screen.
- Shows failed cloud saves and offers retry. Authentication still requires connectivity; do not describe this as a fully offline account experience.
- The service worker only handles this application's directory and only removes old `alandalus-english2-*` caches.
- As with other static Pages assets, the curriculum files themselves are public. The account check is not DRM.

## Database change

Migration `allow_primary_two_portal_profiles` was applied to the existing project. It expands `profiles_grade_level_check` from `('4','5')` to `('2','4','5')`. It does not update or delete any existing profiles or progress. To roll back the UI, restore the four portal files and remove the new course link. Keep the expanded constraint while Grade 2 profiles exist; do not remove or rewrite student records to revert a constraint.

## Visual assets

Seven new male-only scene illustrations are in `assets/images/`, encoded as WebP. The 107 deterministic SVG vocabulary cards in `assets/words/` replace platform-dependent emoji. Female family terms remain part of the curriculum and use text/relationship cards without female character drawings. Image-generation provenance is in `ASSET_PROMPTS.md`.

## Local preview

Serve the portal repository root using a static HTTP server, then open `/english-2/?preview=1` on `localhost` or `127.0.0.1`. Preview mode is limited to loopback hostnames and uses separate local storage. Public hosts always require a portal account. Do not open the HTML using `file://`.

Grade 4's existing course URLs, email-based username mapping, identity-storage keys and legacy class mapping are intentionally retained. Do not include unrelated changes in `connect-plus-4/` when publishing this application.
