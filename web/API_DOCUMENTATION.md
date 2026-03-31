# VoiceScribe API Documentation

Complete API reference for VoiceScribe backend endpoints.

## Base URL

```
https://voicescribe.app/api
```

## Authentication

Most endpoints require authentication via Bearer token:

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Rate Limiting

- **Authenticated users**: No rate limiting
- **Guest users**: 6 requests/hour (allows 3 complete drafts)
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Posts API

### List Posts

```http
GET /api/posts
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by status (`draft` | `published` | `archived`). Default: `draft`

**Response:**
```json
[
  {
    "id": "uuid",
    "journal_id": "uuid",
    "title": "string",
    "slug": "string",
    "content": "string",
    "meta_description": "string",
    "target_keyword": "string",
    "status": "draft",
    "word_count": 0,
    "reading_time_minutes": 0,
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601"
  }
]
```

### Create Post

```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "string (required, 1-200 chars)",
  "slug": "string (optional)",
  "content": "string (optional)",
  "meta_description": "string (optional, max 500 chars)",
  "target_keyword": "string (optional, max 100 chars)",
  "transcript": "string (optional)",
  "audio_file_url": "string (optional, URL)",
  "audio_s3_key": "string (optional)",
  "audio_file_size_bytes": "number (optional)",
  "audio_mime_type": "string (optional)",
  "audio_duration_seconds": "number (optional)",
  "audio_format": "string (optional, m4a|mp3|wav|webm)",
  "style_used": "0|1|2 (optional)",
  "word_count": "number (optional)"
}
```

**Response:** Created post object

### Get Single Post

```http
GET /api/posts/{id}
Authorization: Bearer {token}
```

**Response:** Post object

### Update Post (PATCH)

```http
PATCH /api/posts/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:** Partial post object
```json
{
  "title": "string",
  "content": "string",
  "status": "draft|published|archived",
  ...
}
```

**Response:** Updated post object

### Update Post (PUT)

```http
PUT /api/posts/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:** Complete post object (same as create)

**Response:** Updated post object

### Delete Post

```http
DELETE /api/posts/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true
}
```

---

## Transcription API

### Transcribe Audio

```http
POST /api/transcribe
Content-Type: multipart/form-data
Authorization: Bearer {token} (optional for guests)
```

**Form Data:**
- `file`: Audio file (m4a, mp3, wav, webm)

**Response:**
```json
{
  "text": "transcribed text",
  "duration": 120.5,
  "language": "en"
}
```

**Rate Limiting:**
- Authenticated: None
- Guests: Counts toward 6/hour limit

---

## Generation API

### Generate Blog Post

```http
POST /api/generate
Content-Type: application/json
Authorization: Bearer {token} (optional for guests)
```

**Request Body:**
```json
{
  "transcript": "string (required, min 10 chars)",
  "target_keyword": "string (optional, max 100 chars)",
  "tone": "professional|casual|friendly|formal (optional)",
  "target_length": "short|medium|long (optional)"
}
```

**Response:**
```json
{
  "title": "string",
  "metaDescription": "string",
  "content": "markdown string",
  "wordCount": 1200
}
```

**Rate Limiting:**
- Authenticated: None
- Guests: Counts toward 6/hour limit

---

## Job Status API

### Get Job Status

```http
GET /api/jobs/{jobId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "job_uuid",
  "type": "transcribe|generate",
  "status": "pending|processing|completed|failed",
  "result": {},
  "error": "string (if failed)",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

### Cancel Job

```http
DELETE /api/jobs/{jobId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled"
}
```

---

## Authentication API

### Sign In

```http
POST /api/auth/signin
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "string"
  }
}
```

### Sign Up

```http
POST /api/auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "full_name": "string (optional, max 100 chars)"
}
```

**Response:** Same as sign in

### Sign Out

```http
POST /api/auth/signout
Authorization: Bearer {token}
```

### Get Session

```http
GET /api/auth/session
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "user_metadata": {}
  }
}
```

---

## Profile API

### Get Profile

```http
GET /api/profile
Authorization: Bearer {token}
```

### Update Profile

```http
POST /api/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "string (max 100 chars)",
  "avatar_url": "string (URL)",
  "bio": "string (max 500 chars)",
  "preferences": {}
}
```

---

## Journal API

### Get Journal

```http
GET /api/journal
Authorization: Bearer {token}
```

### Create Journal

```http
POST /api/journal
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "display_name": "string (1-100 chars)",
  "description": "string (max 500 chars)",
  "url_prefix": "string (2-50 chars, lowercase a-z, 0-9, hyphens only)"
}
```

---

## Drafts API

### List Drafts

```http
GET /api/drafts
Authorization: Bearer {token}
```

### Get Draft

```http
GET /api/drafts/{id}
Authorization: Bearer {token}
```

### Update Draft

```http
POST /api/drafts/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

---

## Utility Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "fields": {
    "field_name": "Validation error message"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `404`: Not Found
- `409`: Conflict (e.g., duplicate slug)
- `429`: Rate Limit Exceeded
- `500`: Server Error

---

## TypeScript Types

See `web/src/lib/types.ts` for complete TypeScript definitions.

---

## Middleware & Validation

The API uses centralized middleware for:
- Authentication (`requireAuth`, `optionalAuth`)
- Rate limiting (`requireRateLimit`)
- Input validation (`validateSchema`, `validators`)
- Error handling (`handleApiError`)

Import from `@/lib/api-middleware`:

```typescript
import {
  requireAuth,
  requireRateLimit,
  handleApiError,
  validators,
  validateSchema
} from '@/lib/api-middleware';
```

---

## Best Practices

1. **Always validate input** on server-side
2. **Check authentication** before processing requests
3. **Use rate limiting** for expensive operations (AI calls)
4. **Return consistent error formats** for better client handling
5. **Include rate limit headers** in responses
6. **Log errors** for debugging
