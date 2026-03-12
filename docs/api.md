# SplitWiser API Documentation

Base URL: `/api`

All request/response bodies are JSON unless otherwise noted. Authenticated endpoints require a valid Supabase session cookie.

---

## Authentication

Authenticated endpoints use Supabase Auth. The session is managed via HTTP-only cookies set by Supabase SSR. Requests without a valid session receive a `401` response.

---

## Endpoints

### 1. Create Bill

**`POST /api/bills`**

**Auth:** Required

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 1–200 characters |
| `date` | string | Yes | ISO date format `YYYY-MM-DD` |
| `tax` | number | Yes | >= 0 |
| `tip` | number | Yes | >= 0 |
| `items` | array | Yes | At least 1 item |
| `items[].name` | string | Yes | 1–500 characters |
| `items[].price` | number | Yes | >= 0 |
| `items[].is_ai_parsed` | boolean | No | Defaults to `false` |
| `participants` | array | Yes | At least 1 participant |
| `participants[].name` | string | Yes | 1–100 characters |
| `assignments` | array | Yes | Can be empty |
| `assignments[].item_index` | integer | Yes | Index into `items` array, >= 0 |
| `assignments[].participant_index` | integer | Yes | Index into `participants` array, >= 0 |

**Example Request:**

```json
{
  "title": "Friday Dinner",
  "date": "2026-03-12",
  "tax": 5.40,
  "tip": 10.00,
  "items": [
    { "name": "Margherita Pizza", "price": 18.00 },
    { "name": "Caesar Salad", "price": 12.00 }
  ],
  "participants": [
    { "name": "Alice" },
    { "name": "Bob" }
  ],
  "assignments": [
    { "item_index": 0, "participant_index": 0 },
    { "item_index": 0, "participant_index": 1 },
    { "item_index": 1, "participant_index": 0 }
  ]
}
```

**Response:** `201 Created`

```json
{
  "bill": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Friday Dinner",
    "date": "2026-03-12",
    "tax": 5.40,
    "tip": 10.00,
    "receipt_image_url": null,
    "created_at": "2026-03-12T20:00:00.000Z",
    "updated_at": "2026-03-12T20:00:00.000Z"
  },
  "items": [
    { "id": "uuid", "bill_id": "uuid", "name": "Margherita Pizza", "price": 18.00, "is_ai_parsed": false, "created_at": "..." },
    { "id": "uuid", "bill_id": "uuid", "name": "Caesar Salad", "price": 12.00, "is_ai_parsed": false, "created_at": "..." }
  ],
  "participants": [
    { "id": "uuid", "bill_id": "uuid", "name": "Alice", "created_at": "..." },
    { "id": "uuid", "bill_id": "uuid", "name": "Bob", "created_at": "..." }
  ],
  "assignments": [
    { "bill_item_id": "uuid", "participant_id": "uuid" },
    { "bill_item_id": "uuid", "participant_id": "uuid" },
    { "bill_item_id": "uuid", "participant_id": "uuid" }
  ]
}
```

**Error Codes:**

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid body) |
| 401 | Not authenticated |
| 500 | Internal server error |

**curl Example:**

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"title":"Dinner","date":"2026-03-12","tax":5,"tip":10,"items":[{"name":"Pizza","price":18}],"participants":[{"name":"Alice"}],"assignments":[]}'
```

---

### 2. List Bills

**`GET /api/bills`**

**Auth:** Required

**Query Parameters:**

| Param | Type | Default | Constraints |
|-------|------|---------|-------------|
| `page` | integer | 1 | >= 1 |
| `limit` | integer | 20 | 1–100 |
| `sort` | string | `date_desc` | One of: `date_desc`, `date_asc`, `created_desc` |

**Example Request:**

```
GET /api/bills?page=1&limit=10&sort=date_desc
```

**Response:** `200 OK`

```json
{
  "bills": [
    {
      "id": "uuid",
      "title": "Friday Dinner",
      "date": "2026-03-12",
      "total": 45.40,
      "participant_count": 2,
      "created_at": "2026-03-12T20:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

**Error Codes:**

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid query params) |
| 401 | Not authenticated |
| 500 | Internal server error |

**curl Example:**

```bash
curl http://localhost:3000/api/bills?page=1&limit=10 \
  -H "Cookie: <session-cookie>"
```

---

### 3. Get Bill Detail

**`GET /api/bills/:id`**

**Auth:** Required (owner only)

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Bill ID |

**Response:** `200 OK`

```json
{
  "bill": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Friday Dinner",
    "date": "2026-03-12",
    "tax": 5.40,
    "tip": 10.00,
    "receipt_image_url": null,
    "created_at": "2026-03-12T20:00:00.000Z",
    "updated_at": "2026-03-12T20:00:00.000Z"
  },
  "items": [ ... ],
  "participants": [ ... ],
  "assignments": [ ... ],
  "split": {
    "per_person": [
      {
        "participant_id": "uuid",
        "participant_name": "Alice",
        "items_subtotal": 21.00,
        "tax_share": 3.78,
        "tip_share": 7.00,
        "total": 31.78
      },
      {
        "participant_id": "uuid",
        "participant_name": "Bob",
        "items_subtotal": 9.00,
        "tax_share": 1.62,
        "tip_share": 3.00,
        "total": 13.62
      }
    ],
    "subtotal": 30.00,
    "tax": 5.40,
    "tip": 10.00,
    "total": 45.40
  }
}
```

**Error Codes:**

| Status | Description |
|--------|-------------|
| 401 | Not authenticated |
| 403 | Not the bill owner |
| 404 | Bill not found |
| 500 | Internal server error |

**curl Example:**

```bash
curl http://localhost:3000/api/bills/<bill-id> \
  -H "Cookie: <session-cookie>"
```

---

### 4. Update Bill

**`PUT /api/bills/:id`**

**Auth:** Required (owner only)

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Bill ID |

**Request Body:** Same schema as `POST /api/bills`. Replaces items, participants, and assignments entirely.

**Response:** `200 OK` — Same shape as `GET /api/bills/:id`.

**Error Codes:**

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid body) |
| 401 | Not authenticated |
| 403 | Not the bill owner |
| 404 | Bill not found |
| 500 | Internal server error |

**curl Example:**

```bash
curl -X PUT http://localhost:3000/api/bills/<bill-id> \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"title":"Updated Dinner","date":"2026-03-12","tax":5,"tip":10,"items":[{"name":"Pizza","price":18}],"participants":[{"name":"Alice"}],"assignments":[]}'
```

---

### 5. Delete Bill

**`DELETE /api/bills/:id`**

**Auth:** Required (owner only)

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Bill ID |

**Response:** `204 No Content` (empty body)

**Error Codes:**

| Status | Description |
|--------|-------------|
| 401 | Not authenticated |
| 403 | Not the bill owner |
| 404 | Bill not found |
| 500 | Internal server error |

**curl Example:**

```bash
curl -X DELETE http://localhost:3000/api/bills/<bill-id> \
  -H "Cookie: <session-cookie>"
```

---

### 6. Parse Receipt

**`POST /api/receipts/parse`**

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `image` | File | Yes | JPEG, PNG, or HEIC. Max 10MB. |

**Response:** `200 OK`

```json
{
  "items": [
    { "name": "Margherita Pizza", "price": 18.00, "confidence": "high" },
    { "name": "Caesar Salad", "price": 12.00, "confidence": "medium" }
  ],
  "receipt_image_url": "https://your-project.supabase.co/storage/v1/object/public/receipts/..."
}
```

**Error Codes:**

| Status | Description |
|--------|-------------|
| 400 | No image provided or unsupported format |
| 401 | Not authenticated |
| 422 | Image is not a receipt |
| 429 | Gemini rate limit exceeded |
| 500 | Internal server error |

**curl Example:**

```bash
curl -X POST http://localhost:3000/api/receipts/parse \
  -H "Cookie: <session-cookie>" \
  -F "image=@receipt.jpg"
```

---

### 7. Get Bill Share (Public)

**`GET /api/bills/:id/share`**

**Auth:** None (public endpoint)

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Bill ID |

**Response:** `200 OK`

```json
{
  "title": "Friday Dinner",
  "date": "2026-03-12",
  "split": {
    "per_person": [
      {
        "participant_id": "uuid",
        "participant_name": "Alice",
        "items_subtotal": 21.00,
        "tax_share": 3.78,
        "tip_share": 7.00,
        "total": 31.78,
        "items": [
          { "name": "Margherita Pizza", "price": 9.00, "shared_with": 2 },
          { "name": "Caesar Salad", "price": 12.00, "shared_with": 1 }
        ]
      },
      {
        "participant_id": "uuid",
        "participant_name": "Bob",
        "items_subtotal": 9.00,
        "tax_share": 1.62,
        "tip_share": 3.00,
        "total": 13.62,
        "items": [
          { "name": "Margherita Pizza", "price": 9.00, "shared_with": 2 }
        ]
      }
    ],
    "subtotal": 30.00,
    "tax": 5.40,
    "tip": 10.00,
    "total": 45.40
  }
}
```

**Error Codes:**

| Status | Description |
|--------|-------------|
| 404 | Bill not found |
| 500 | Internal server error |

**curl Example:**

```bash
curl http://localhost:3000/api/bills/<bill-id>/share
```
