# SkillConnect API Documentation

**Base URL:** `http://localhost:5077`  
**Authentication:** Bearer JWT (obtained from Better Auth `/api/auth/token`)  
**Content-Type:** `application/json`

---

## Authentication

All endpoints except `/api/auth/health` and `/api/workers/search`, `/api/workers/{id}`, `/api/categories`, `/api/reviews/worker/{workerProfileId}` require a valid JWT token.

```
Authorization: Bearer <your-jwt-token>
```

The JWT is obtained from the Next.js frontend via Better Auth's token endpoint (`/api/auth/token`).

---

## SignalR Hubs

| Hub | URL | Description |
|-----|-----|-------------|
| ChatHub | `/hubs/chat` | Real-time chat messaging |
| NotificationHub | `/hubs/notifications` | Real-time notifications |

Both hubs require JWT authentication via `access_token` query parameter.

---

## Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/health` | None | Health check |
| GET | `/api/auth/me` | Required | Get current user info |

#### GET /api/auth/health
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-30T12:00:00Z"
}
```

#### GET /api/auth/me
**Response:**
```json
{
  "id": "user-uuid",
  "email": "user_251911234567@skillconnect.internal",
  "name": "0911234567",
  "phoneNumber": "+251911234567",
  "role": "Customer",
  "sessionId": "session-uuid"
}
```

---

### Workers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/workers/search` | None | Search workers with filters |
| GET | `/api/workers/{id:int}` | None | Get worker profile by ID |
| GET | `/api/workers/me` | Required | Get current user's worker profile |

#### GET /api/workers/search
**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Category slug filter |
| `latitude` | double | - | Search center latitude |
| `longitude` | double | - | Search center longitude |
| `radius` | double | 25 | Search radius in km (max 500) |
| `availability` | string | any | `any`, `available_now`, `today`, `this_week` |
| `query` | string | - | Free-text search |
| `minRating` | double | - | Minimum rating (0-5) |
| `minPrice` | decimal | - | Minimum hourly rate |
| `maxPrice` | decimal | - | Maximum hourly rate |
| `isVerified` | bool | - | Only verified workers |
| `sortBy` | string | recommended | `recommended`, `distance`, `rating`, `price_low`, `price_high`, `reviews` |
| `page` | int | 1 | Page number |
| `pageSize` | int | 20 | Results per page (max 100) |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "userId": "user-uuid",
      "name": "Abebe Kebede",
      "avatarUrl": null,
      "headline": null,
      "bio": "Experienced plumber with 10+ years...",
      "category": "plumbing",
      "skills": ["plumbing", "pipe-fitting"],
      "languages": ["Amharic", "English"],
      "rating": 4.5,
      "reviewCount": 12,
      "hourlyRate": 0,
      "currency": "ETB",
      "distanceKm": 3.2,
      "serviceRadiusKm": 15,
      "location": null,
      "isVerified": true,
      "availability": "available_now",
      "isAvailable": true,
      "completedJobsCount": 45,
      "responseTimeMinutes": null,
      "portfolio": [],
      "featured": false
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1,
  "hasMore": false
}
```

#### GET /api/workers/{id:int}
**Response:** Single `WorkerDetailResponse` object (includes `recentReviews` array).

#### GET /api/workers/me
**Response:** Same as `GET /api/workers/{id}` for the authenticated user.

---

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | None | Get all service categories |

#### GET /api/categories
**Response:**
```json
[
  {
    "id": 1,
    "name": "Plumbing",
    "slug": "plumbing",
    "iconUrl": null
  }
]
```

---

### Job Requests

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/jobrequests` | Required | Create a job request |
| GET | `/api/jobrequests/{id:int}` | Required | Get job request by ID |
| GET | `/api/jobrequests/my` | Required | Get current user's job requests |
| GET | `/api/jobrequests/open` | Required | Get all open job requests |
| PATCH | `/api/jobrequests/{id:int}/status` | Required | Update job request status |

#### POST /api/jobrequests
**Request Body:**
```json
{
  "categoryId": 1,
  "description": "Kitchen sink is leaking",
  "locationLat": 9.0222,
  "locationLng": 38.7468,
  "address": "Bole, Addis Ababa"
}
```

**Response:** `JobRequestResponse` object.

#### PATCH /api/jobrequests/{id:int}/status
**Request Body:**
```json
{
  "status": "Quoted"
}
```

**Valid Statuses:** `Open`, `Quoted`, `Accepted`, `Completed`, `Cancelled`

---

### Quotes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/quotes` | Required (Worker) | Submit a quote |
| GET | `/api/quotes/{id:int}` | Required | Get quote by ID |
| GET | `/api/quotes/my` | Required (Worker) | Get current worker's quotes |
| GET | `/api/quotes/job-request/{jobRequestId:int}` | Required | Get quotes for a job request |
| PATCH | `/api/quotes/{id:int}/status` | Required | Update quote status |

#### POST /api/quotes
**Request Body:**
```json
{
  "jobRequestId": 1,
  "price": 1500.00,
  "message": "I can fix this tomorrow morning",
  "expiresAt": "2026-10-07T00:00:00Z"
}
```

#### PATCH /api/quotes/{id:int}/status
**Request Body:**
```json
{
  "status": "Accepted"
}
```

**Valid Statuses:** `Pending`, `Accepted`, `Rejected`, `Countered`

---

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | Required | Create booking from quote |
| GET | `/api/bookings/{id:int}` | Required | Get booking by ID |
| GET | `/api/bookings/my` | Required | Get current user's bookings |
| GET | `/api/bookings/worker/{workerProfileId:int}` | Required | Get bookings for a worker |
| PATCH | `/api/bookings/{id:int}/status` | Required | Update booking status |

#### POST /api/bookings
**Request Body:**
```json
{
  "quoteId": 1
}
```

#### PATCH /api/bookings/{id:int}/status
**Request Body:**
```json
{
  "status": "InProgress"
}
```

**Valid Statuses:** `Confirmed`, `CheckedIn`, `InProgress`, `Completed`, `Disputed`, `Cancelled`

---

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | Required | Submit a review |
| GET | `/api/reviews/worker/{workerProfileId:int}` | None | Get reviews for a worker |
| GET | `/api/reviews/booking/{bookingId:int}` | Required | Get reviews for a booking |

#### POST /api/reviews
**Request Body:**
```json
{
  "bookingId": 1,
  "rating": 5,
  "comment": "Excellent work, very professional!"
}
```

---

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat/threads` | Required | Create chat thread |
| GET | `/api/chat/threads` | Required | Get user's chat threads |
| GET | `/api/chat/threads/{threadId:int}` | Required | Get specific thread |
| POST | `/api/chat/messages` | Required | Send a message |
| GET | `/api/chat/threads/{threadId:int}/messages` | Required | Get thread messages |

#### POST /api/chat/threads
**Request Body:**
```json
{
  "bookingId": 1,
  "participantIds": ["user-uuid-1", "user-uuid-2"]
}
```

#### POST /api/chat/messages
**Request Body:**
```json
{
  "threadId": 1,
  "content": "Hello, when can you come?",
  "attachmentUrl": null
}
```

---

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Required | Get user's notifications |
| GET | `/api/notifications/unread-count` | Required | Get unread count |
| POST | `/api/notifications/mark-read` | Required | Mark notifications as read |

#### POST /api/notifications/mark-read
**Request Body:**
```json
{
  "notificationIds": [1, 2, 3]
}
```

---

### Verification

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/verification` | Required (Worker) | Submit verification document |
| GET | `/api/verification/worker/{workerProfileId:int}` | Required | Get worker's submissions |
| GET | `/api/verification/pending` | Admin | Get pending submissions |
| PATCH | `/api/verification/{id:int}/review` | Admin | Review submission |

#### POST /api/verification
**Request Body:**
```json
{
  "documentType": "national_id",
  "documentUrl": "https://example.com/doc.jpg"
}
```

#### PATCH /api/verification/{id:int}/review
**Request Body:**
```json
{
  "status": "Approved",
  "resolution": null
}
```

---

### Disputes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/disputes` | Required | Raise a dispute |
| GET | `/api/disputes/{id:int}` | Required | Get dispute by ID |
| GET | `/api/disputes/my` | Required | Get user's disputes |
| GET | `/api/disputes/open` | Admin | Get open disputes |
| PATCH | `/api/disputes/{id:int}/resolve` | Admin | Resolve dispute |

#### POST /api/disputes
**Request Body:**
```json
{
  "bookingId": 1,
  "reason": "Worker did not complete the job"
}
```

#### PATCH /api/disputes/{id:int}/resolve
**Request Body:**
```json
{
  "resolution": "Refund issued to customer"
}
```

---

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments` | Required | Create payment record |
| GET | `/api/payments/{id:int}` | Required | Get payment by ID |
| GET | `/api/payments/booking/{bookingId:int}` | Required | Get booking payments |
| GET | `/api/payments/worker/{workerProfileId:int}` | Required | Get worker payments |
| PATCH | `/api/payments/{id:int}/status` | Required | Update payment status |

#### POST /api/payments
**Request Body:**
```json
{
  "bookingId": 1,
  "amount": 1500.00,
  "provider": "Telebirr"
}
```

**Valid Providers:** `Telebirr`, `Chapa`, `CBE Birr`

---

## Error Responses

All errors follow RFC 7807 Problem Details format:

```json
{
  "type": "https://httpstatuses.io/400",
  "title": "Bad Request",
  "status": 400,
  "detail": "Quote is not in a pending state",
  "traceId": "0HN5V1234567890:00000001",
  "timestamp": "2026-09-30T12:00:00Z"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid JWT |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Invalid state transition |
| 500 | Internal Server Error |

---

## Running the API

```bash
# Navigate to API project
cd Backend/SkillConnect.Api

# Run with Development environment (uses Neon connection)
ASPNETCORE_ENVIRONMENT=Development dotnet run

# Or run with Production environment
dotnet run
```

The API will be available at `http://localhost:5077`.

---

## Project Structure

```
Backend/
├── SkillConnect.Api/           # ASP.NET Core Web API
│   ├── Controllers/            # API Controllers
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Hubs/                   # SignalR Hubs
│   ├── Services/               # Business Logic Services
│   ├── Extensions/             # DI Extensions
│   ├── Middleware/             # Custom Middleware
│   └── Properties/             # Launch Settings
├── SkillConnect.Core/          # Domain Entities & Enums
│   ├── Entities/               # Domain Models
│   └── Enums/                  # Domain Enums
├── SkillConnect.Infrastructure/# Data Access Layer
│   ├── Persistence/            # EF Core DbContext & Configurations
│   └── Migrations/             # Database Migrations
└── API_DOCUMENTATION.md        # This file
```