# Scout — Personal Book Companion

Scout is a mobile app that helps you manage your reading list and get personalised book recommendations from an AI companion that learns your taste over time.

---

## Project Structure

```
scout-app/
  server/                        # Express.js backend
    prisma/
      schema.prisma              # Database schema (SQLite for local, swappable to Postgres)
    src/
      index.js                   # Server entry point
      routes/
        auth.js                  # Register, login, /me
        books.js                 # Search + upsert books via Google Books
        chat.js                  # Scout chat, message history, daily recommendation
        userbooks.js             # Up Next list CRUD
        taste.js                 # Taste profile read/write
      middleware/
        auth.js                  # JWT verification middleware
      lib/
        anthropic.js             # (reserved for shared Anthropic helpers)
        googleBooks.js           # Google Books API proxy + formatter
        tasteUpdater.js          # Extracts taste signals from chat and persists them
    package.json
    .env.example

  app/                           # Expo Router screens
    _layout.jsx                  # Root layout (dark background, status bar)
    (tabs)/
      _layout.jsx                # Tab bar (Up Next + Scout)
      index.jsx                  # Up Next tab — reading list + auth screen
      scout.jsx                  # Scout chat tab

  components/
    BookCard.jsx                 # Book row with cover, title, status badge
    ScoutAvatar.jsx              # Animated circular avatar with idle eye movement
    TasteUpdateBanner.jsx        # Animated toast shown when taste profile updates
    DailyRecommendation.jsx      # Today's pick card shown at top of chat
    ChatBubble.jsx               # Chat message bubble (Scout or user)

  lib/
    api.js                       # All API calls to the backend (fetch wrapper)
    storage.js                   # SecureStore helpers for JWT token

  constants/
    theme.js                     # Colors, fonts, status badge styles

  app.json                       # Expo config
  package.json                   # Frontend dependencies
  babel.config.js                # Babel + Reanimated plugin
```

---

## Setup & Running

### 1. Install dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend (from project root):**
```bash
npm install
```

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite path — keep as `file:./dev.db` for local dev |
| `JWT_SECRET` | Any long random string — used to sign auth tokens |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (get one at console.anthropic.com) |
| `GOOGLE_BOOKS_API_KEY` | Your Google Books API key (optional — works without one at lower rate limits) |
| `PORT` | Server port — defaults to `3001` |

### 3. Initialise the database

```bash
cd server
npx prisma db push
```

This creates `server/prisma/dev.db` and runs the schema migrations.

### 4. Start the backend

```bash
cd server
npm run dev
```

The server starts at `http://localhost:3001`. Check it's running:
```
GET http://localhost:3001/health  →  { "ok": true }
```

### 5. Start the Expo app

From the project root:
```bash
npx expo start
```

Then press `i` for iOS Simulator, `a` for Android, or scan the QR code with Expo Go.

---

## Key Design Decisions

**Taste profile as JSON strings in SQLite** — arrays like `lovedAuthors` are stored as JSON strings. The backend serialises/deserialises automatically. When you migrate to PostgreSQL, swap these to native array columns.

**Google Books as backend proxy** — the API key never reaches the client. Search results are formatted and optionally cached in the `Book` table on first add.

**Taste updates via background Claude call** — when a user message contains an opinion keyword (loved, hated, not for me, etc.), `tasteUpdater.js` fires a second Claude call to extract structured updates and persists them. A banner animates in to confirm.

**Daily recommendation caching** — the daily pick is stored as a `ChatMessage` with a `[daily_rec_YYYY-MM-DD]` prefix, so it's only generated once per day per user.

**JWT stored in SecureStore** — tokens are kept in the device's encrypted keychain, not AsyncStorage.

---

## Switching to PostgreSQL

1. Change `server/prisma/schema.prisma` datasource `provider` from `"sqlite"` to `"postgresql"`
2. Update `DATABASE_URL` in `.env` to your Postgres connection string
3. Change JSON string columns (`lovedAuthors`, etc.) to `String[]` native arrays in the schema
4. Run `npx prisma migrate dev`
