# Backend Technology Stack — Justification Document
## VOLT VYBE · Systems for Design and Implementation · Assignment 2

---

## 1. What is a REST API?

A **REST API** (Representational State Transfer Application Programming Interface) is a set of rules for how two computers communicate over HTTP — the same protocol used by web browsers. It is the industry-standard way to expose data and operations from a server to clients (websites, mobile apps, other services).

### The six REST constraints

| Constraint | What it means in practice |
|---|---|
| **Client–Server** | The frontend (React) and backend (Node.js) are separate programs. They only talk over HTTP. |
| **Stateless** | Every request contains all the information needed. The server holds no session between calls. |
| **Cacheable** | Responses can declare themselves cacheable so clients avoid unnecessary repeat calls. |
| **Uniform Interface** | Resources are identified by URLs. You use standard HTTP verbs on them. |
| **Layered System** | The client doesn't know if it's talking directly to the server or a proxy in front of it. |
| **Code on Demand** (optional) | The server can optionally send executable code (rarely used). |

### HTTP verbs and what they mean

| Verb | Meaning | Example |
|---|---|---|
| `GET` | Read a resource | `GET /api/items` → list all items |
| `POST` | Create a new resource | `POST /api/items` → add an item |
| `PUT` | Replace a resource entirely | `PUT /api/items/1` → overwrite item #1 |
| `PATCH` | Partially update a resource | `PATCH /api/items/1` → change only the price |
| `DELETE` | Remove a resource | `DELETE /api/items/1` → delete item #1 |

### HTTP status codes used in this project

| Code | Meaning | When we send it |
|---|---|---|
| `200 OK` | Success | GET / PATCH / PUT returned data |
| `201 Created` | Resource created | POST succeeded |
| `204 No Content` | Success, nothing to return | DELETE succeeded |
| `400 Bad Request` | Invalid input | Zod validation failed |
| `404 Not Found` | Resource doesn't exist | ID not found in store |
| `500 Internal Server Error` | Unexpected failure | Unhandled exception |

---

## 2. Framework Benchmark

Five free, open-source Node.js frameworks were evaluated against eight criteria scored 1 (worst) – 5 (best).

### Frameworks evaluated

| # | Framework | Description |
|---|---|---|
| A | **Express.js** | The original Node.js web framework (est. 2010). Minimal, unopinionated. |
| B | **Fastify** | High-performance framework with built-in JSON schema validation. |
| C | **Hono** | Ultra-lightweight, edge-first, TypeScript-native. |
| D | **NestJS** | Full opinionated framework inspired by Angular. Uses decorators. |
| E | **Koa** | Minimal successor to Express by the same team. Uses async middleware. |

### Scoring criteria (1–5)

| Criterion | Weight | Rationale |
|---|---|---|
| Community & ecosystem | ×3 | More resources = faster debugging in an academic deadline |
| Learning curve (easy = 5) | ×3 | Must be productive quickly; course is not about the framework itself |
| Test ecosystem | ×3 | Assignment requires maximum code coverage |
| TypeScript support | ×2 | Project already uses TypeScript throughout |
| Documentation quality | ×2 | Essential for self-directed learning |
| Production readiness | ×2 | Stability and real-world adoption |
| Performance (rps) | ×1 | In-memory store; throughput is not a bottleneck |
| Built-in validation | ×1 | Gap filled by Zod regardless of framework |

### Raw scores

| Criterion | Express | Fastify | Hono | NestJS | Koa |
|---|---|---|---|---|---|
| Community & ecosystem | **5** | 4 | 3 | 4 | 3 |
| Learning curve | **5** | 4 | 4 | 2 | 4 |
| Test ecosystem | **5** | 4 | 3 | 4 | 4 |
| TypeScript support | 3 | **5** | **5** | **5** | 3 |
| Documentation quality | **5** | 4 | 4 | 4 | 3 |
| Production readiness | **5** | **5** | 3 | **5** | 4 |
| Performance (rps) | 3 | **5** | **5** | 3 | 4 |
| Built-in validation | 2 | 4 | 3 | **5** | 2 |

### Weighted totals

| Framework | Community ×3 | Learn ×3 | Tests ×3 | TS ×2 | Docs ×2 | Prod ×2 | Perf ×1 | Valid ×1 | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| **Express** | 15 | 15 | 15 | 6 | 10 | 10 | 3 | 2 | **76** |
| Fastify | 12 | 12 | 12 | 10 | 8 | 10 | 5 | 4 | 73 |
| Hono | 9 | 12 | 9 | 10 | 8 | 6 | 5 | 3 | 62 |
| NestJS | 12 | 6 | 12 | 10 | 8 | 10 | 3 | 5 | 66 |
| Koa | 9 | 12 | 12 | 6 | 6 | 8 | 4 | 2 | 59 |

**Winner: Express.js (76 points)**

---

## 3. Chosen Stack

```
Node.js 22 + TypeScript 5
Express.js 4          ← HTTP server & routing
Zod 3                 ← Request body & query validation
Vitest 2 + Supertest  ← Unit & integration testing
tsx                   ← TypeScript execution in development
```

### Why Express.js

1. **Largest community in the Node.js ecosystem** — 90K+ GitHub stars, 30M+ weekly npm downloads. More StackOverflow answers than any other Node.js framework, which reduces debugging time under a deadline.

2. **Lowest learning curve** — Express has only a handful of concepts: `app`, `Router`, middleware, `req`, `res`. A student can read the entire Getting Started guide in under an hour. NestJS by comparison requires understanding modules, providers, decorators, and dependency injection before writing a single route.

3. **Best-in-class testing story** — `supertest` is the de-facto Express testing library. It makes HTTP-level integration tests trivial (`request(app).get('/api/items')`) and requires zero server setup. The combination of Vitest + supertest achieves near-100% code coverage on route logic.

4. **Unopinionated = easy to separate concerns** — Express does not force a folder structure. This makes it easy to comply with the assignment's requirement to "separate endpoints from the rest of the implementation" using a `routes/` directory and a distinct `store/` layer.

5. **Performance is not a bottleneck here** — The assignment explicitly requires in-memory storage. With no I/O latency, even Express's comparatively lower raw throughput is more than sufficient for the workload.

### Why Zod for validation

- **TypeScript-first**: schemas double as TypeScript types — define once, use everywhere.
- **`safeParse`** returns a result object instead of throwing, making error handling clean and explicit.
- **Flat error messages** via `.flatten().fieldErrors` map directly to HTTP 400 response bodies.
- Zero runtime dependencies; tiny bundle size.

---

## 4. Architecture Overview

```
backend/
├── src/
│   ├── app.ts              Express app (no listen — testable)
│   ├── server.ts           Entry point (calls app.listen)
│   ├── routes/
│   │   ├── items.ts        CRUD endpoints  →  /api/items
│   │   └── stats.ts        Statistics      →  /api/stats
│   ├── store/
│   │   ├── initialData.ts  Seed data (12 clothing items)
│   │   └── itemStore.ts    In-memory CRUD layer
│   └── validation/
│       └── itemSchema.ts   Zod schemas + TypeScript types
└── tests/
    ├── items.test.ts       Full CRUD coverage
    └── stats.test.ts       Statistics coverage
```

**Key architectural decisions:**

- `app.ts` exports the Express app **without calling `listen()`**. This allows test files to import `app` directly and use `supertest` without a port conflict.
- All business logic (storage, ID generation) lives in `store/` — routes only validate, delegate, and format responses.
- The `store.reset()` method exists specifically for test isolation: each test resets to a clean 12-item state.

---

## 5. API Endpoint Reference

### Items — `/api/items`

| Method | Path | Description | Success | Error |
|---|---|---|---|---|
| GET | `/api/items` | List all items (paginated) | 200 | 400 |
| GET | `/api/items/:id` | Get one item by ID | 200 | 404 |
| POST | `/api/items` | Create a new item | 201 | 400 |
| PUT | `/api/items/:id` | Replace an item entirely | 200 | 400, 404 |
| PATCH | `/api/items/:id` | Partially update an item | 200 | 400, 404 |
| DELETE | `/api/items/:id` | Delete an item | 204 | 404 |

**Pagination query parameters** (`GET /api/items`):

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer ≥ 1 | `1` | Page number |
| `limit` | integer 1–100 | `10` | Items per page |
| `category` | string | — | Filter by category (e.g. `tee`, `cap`) |
| `inStock` | `true`/`false` | — | Filter by stock availability |
| `colorGroup` | string | — | Filter by color group (e.g. `dark`, `vibrant`) |

**Pagination response envelope:**
```json
{
  "data": [...],
  "page": 1,
  "limit": 10,
  "total": 12,
  "totalPages": 2
}
```

### Statistics — `/api/stats`

| Method | Path | Description | Success |
|---|---|---|---|
| GET | `/api/stats` | Computed analytics over all items | 200 |

**Response shape:**
```json
{
  "totalItems": 12,
  "totalValue": 14045,
  "avgPrice": 64.83,
  "avgRating": 4.45,
  "inStockCount": 11,
  "outOfStockCount": 1,
  "featuredCount": 5,
  "categoryBreakdown": { "tee": 2, "pants": 2, "cap": 2, "...": "..." },
  "colorGroupBreakdown": { "dark": 4, "vibrant": 3, "...": "..." },
  "styleTagBreakdown": { "streetwear": 6, "casual": 4, "...": "..." },
  "priceRanges": { "$0-50": 4, "$51-80": 3, "$81-120": 3, "$120+": 2 },
  "topRated": [{ "id": "4", "name": "STATIC HOODIE", "rating": 4.9 }, "..."]
}
```
