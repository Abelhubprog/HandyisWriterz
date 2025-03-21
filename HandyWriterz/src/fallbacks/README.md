# Fallback Data

This directory contains fallback data for the application to use when the database is unavailable.

## Files

- `posts_adult-health-nursing.json`: Sample posts for the adult-health-nursing service
- `posts_mental-health-nursing.json`: Sample posts for the mental-health-nursing service
- `posts_child-nursing.json`: Sample posts for the child-nursing service
- `posts_special-education.json`: Sample posts for the special-education service
- `posts_social-work.json`: Sample posts for the social-work service
- `posts_ai.json`: Sample posts for the ai service
- `posts_crypto.json`: Sample posts for the crypto service
- `profiles.json`: Sample user profiles
- `all_posts.json`: Combined posts from all service types

## Usage

This data is automatically used by the application when the database connection fails.
The data is loaded through the `useDatabaseQuery` hook which implements fallback mechanisms.

## Regenerating Data

To regenerate this data, run:

```
node scripts/generate-fallback-data.js
```
