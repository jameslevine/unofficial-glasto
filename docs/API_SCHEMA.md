# API Schema

## Base

- **Base URL (dev):** `https://api-dev.<domain>/v1`
- **Base URL (prod):** `https://api.<domain>/v1`
- **Versioning:** URL path versioning (`/v1`).
- **Auth:** `Authorization: Bearer <Cognito ID token>` for `/me/*`. All other endpoints are public.
- **Response envelope:** `{ "success": true, "data": ... }` or `{ "success": false, "error": "<message>" }`.
- **Caching:** Lineup endpoints return `ETag` and `Last-Modified` headers; clients use `If-None-Match` for cheap revalidation.

## Endpoints

### Lineup

| Method | Path                     | Auth | Description                  |
| ------ | ------------------------ | ---- | ---------------------------- |
| GET    | `/lineup/:year`          | —    | Full year payload.           |
| GET    | `/lineup/:year/by-stage` | —    | Grouped by stage.            |
| GET    | `/lineup/:year/by-day`   | —    | Grouped by day.              |
| GET    | `/stages`                | —    | All stages with coordinates. |

#### `GET /lineup/:year`

```json
{
  "success": true,
  "data": [
    {
      "id": "2024-pyramid-coldplay-sat-2200",
      "year": 2024,
      "title": "Coldplay",
      "artistSlug": "coldplay",
      "stage": "Pyramid Stage",
      "area": "Music",
      "day": "SATURDAY",
      "startsAt": "2024-06-29T22:00:00+01:00",
      "endsAt": "2024-06-29T23:30:00+01:00",
      "description": "...",
      "sourceUrl": "https://www.glastonburyfestivals.co.uk/..."
    }
  ]
}
```

### Artists

| Method | Path                     | Auth | Description                                           |
| ------ | ------------------------ | ---- | ----------------------------------------------------- |
| GET    | `/artists/:slug`         | —    | Artist detail with cached Spotify metadata.           |
| GET    | `/artists/:slug/spotify` | —    | Live Spotify proxy (top tracks, embed URL). 1h cache. |

#### `GET /artists/:slug`

```json
{
  "success": true,
  "data": {
    "slug": "coldplay",
    "name": "Coldplay",
    "spotifyId": "4gzpq5DPGxSnKTe4SA8HAU",
    "spotifyUrl": "https://open.spotify.com/artist/4gzpq5DPGxSnKTe4SA8HAU",
    "imageUrl": "https://...",
    "genres": ["pop", "rock"],
    "topTracks": [{ "id": "...", "name": "Yellow", "previewUrl": "..." }],
    "lastResolvedAt": "2026-05-21T12:00:00Z"
  }
}
```

### Favourites (Cognito-authenticated)

| Method | Path                     | Auth | Description                |
| ------ | ------------------------ | ---- | -------------------------- |
| GET    | `/me/favourites`         | ✅   | List favourites.           |
| POST   | `/me/favourites`         | ✅   | Add favourite.             |
| DELETE | `/me/favourites/:perfId` | ✅   | Remove favourite.          |
| POST   | `/me/sync`               | ✅   | Bulk sync (pull-and-push). |

#### `POST /me/favourites`

Request:

```json
{ "perfId": "2024-pyramid-coldplay-sat-2200", "updatedAt": "2026-05-21T12:00:00Z" }
```

Response:

```json
{ "success": true, "data": { "perfId": "...", "userId": "...", "updatedAt": "..." } }
```

#### `POST /me/sync`

Request:

```json
{
  "since": "2026-05-20T00:00:00Z",
  "favourites": [{ "perfId": "...", "updatedAt": "...", "deleted": false }]
}
```

Response includes both server-merged state and any new server-side changes since `since`.

## Error Format

```json
{ "success": false, "error": "Validation error: year must be 2014..2026" }
```

| HTTP code | Meaning                       |
| --------- | ----------------------------- |
| 400       | Validation error              |
| 401       | Missing/invalid Cognito token |
| 404       | Resource not found            |
| 429       | Rate limited (Spotify proxy)  |
| 500       | Server error                  |

## Rate Limiting

- API Gateway throttling: 50 rps burst, 100 rps sustained per IP.
- `/artists/:slug/spotify` cached server-side for 1h to insulate from Spotify rate limits.
