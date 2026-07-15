## 1. Project Overview

- This is a Next.js App Router project for a Bengali news portal/admin newsroom system named `anwartv`. The public side renders a homepage, article list, and article detail pages. The admin side supports role-based dashboards, article creation/editing/listing/detail review, homepage curation, and admin user management.
- README is the default `create-next-app` README and does not document domain-specific behavior.
- Tech stack and versions from `package.json`:
  - Next.js: `16.2.10`
  - React: `19.2.4`
  - React DOM: `19.2.4`
  - NextAuth: `^5.0.0-beta.31`
  - `@auth/mongodb-adapter`: `^3.11.2`
  - Mongoose: `^9.7.4`
  - Upstash Redis: `^1.38.0`
  - bcryptjs: `^3.0.3`
  - shadcn CLI/package: `^4.13.0`
  - Base UI React: `^1.6.0`
  - Tiptap: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/pm` all `^3.27.3`
  - Tailwind CSS: `^4`
  - `@tailwindcss/postcss`: `^4`
  - `@tailwindcss/typography`: `^0.5.20`
  - lucide-react: `^1.24.0`
  - framer-motion: `^12.42.2`
  - slugify: `^1.6.9`
  - clsx: `^2.1.1`
  - tailwind-merge: `^3.6.0`
  - class-variance-authority: `^0.7.1`
  - tw-animate-css: `^1.4.0`
  - TypeScript: `^5`
  - ESLint: `^9`
  - eslint-config-next: `16.2.10`
  - React Compiler Babel plugin: `1.0.0`
- `next.config.ts` enables `reactCompiler: true` and allows `next/image` remote images from `https://i.ibb.co/**` and `https://*.ibb.co/**`.
- `components.json` configures shadcn with `style: "base-nova"`, `rsc: true`, `tsx: true`, Tailwind CSS file `src/app/globals.css`, neutral base color, CSS variables, and lucide icons.

## 2. Folder Structure

```text
src/
  app/                         Next.js App Router routes, layouts, API routes, global CSS, favicon.
    (admin)/                   Route group for protected admin/editor/writer pages.
      admin/                   Admin namespace pages and layout.
        articles/              Admin article list and article detail pages.
          [id]/                Admin article detail route.
        dashboard/             Admin dashboard page.
        edit/                  Admin article edit route.
          [id]/                Edit form for an existing article.
        homepage-curator/      Client-side homepage slot curation UI.
        new/                   New article page.
        users/                 Client-side user management page.
      editor/                  Editor layout, home page, dashboard redirect.
        dashboard/             Redirect route to /editor.
      write/                   Writer home page and layout.
      writer/                  Writer dashboard alias layout.
        dashboard/             Redirect route to /write.
    (auth)/                    Login and registration pages.
      login/                   Client login form.
      register/                Client registration form.
    (public)/                  Public layout and public content routes.
      articles/                Public article listing.
      news/                    Public news detail namespace.
        [id]/                  Public news detail by slug/id.
    api/                       Next.js route handlers.
      admin/                   Admin-only or admin-oriented API routes.
        homepage-layout/       Homepage layout read/update API.
        users/                 User management APIs.
          [id]/                Single-user update API.
      articles/                Article list/create API.
        [id]/                  Article detail/update API.
      auth/                    Auth registration and NextAuth route handlers.
        register/              Custom registration API.
        [...nextauth]/         NextAuth GET/POST handlers.
      categories/              Category APIs.
        seed/                  Category seeding endpoint.
      health/                  Health check endpoint.
  components/                  React components grouped by feature.
    admin/                     Admin shell, article forms/tables, dashboards, editor.
    Home/                      Homepage server components.
    layout/                    Public site header.
    providers/                 App providers.
    ui/                        shadcn/Base UI primitives.
  constant/                    Role constants and types.
  infrastructure/              App configuration.
    config/                    Role-based navigation config.
  lib/                         Shared auth, DB, Redis, route, cache, utility modules.
  Model/                       Mongoose models. Note: folder is `Model`, not `models`.
  types/                       Type augmentations.
```

Relevant top-level folders/files:
- `public/`: static assets, including `anwartv-logo.jpg` and default SVG assets.
- `node_modules/`: installed dependencies.
- `.next/`: Next.js build/dev output.
- `AGENTS.md`, `CLAUDE.md`: assistant instructions/context files.
- `components.json`: shadcn configuration.
- `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json`: framework/tooling config.
- `inspect-categories.cjs`, `temp-create-user.cjs`: root utility scripts.

## 3. Database Models (Mongoose)

There is no `src/models/` directory. Mongoose models are located in `src/Model/`.

### `src/Model/User.ts`

- Model name: `User`
- Interface: `IUser extends Document`
- Fields:
  - `name`: `String`, required.
  - `email`: `String`, required, unique.
  - `password`: `String`, required.
  - `role`: `String`, enum `Object.values(ROLES)` where roles are `admin`, `editor`, `writer`, `reader`; default `reader`; indexed.
  - `accountStatus`: `String`, enum `active`, `inactive`, `suspended`; default `active`; indexed.
  - `avatar`: `String`, optional.
  - `bio`: `String`, optional.
  - `isVerified`: `Boolean`, default `false`; indexed.
  - `isActive`: `Boolean`, default `true`; indexed.
  - `createdAt`: `Date`, added by timestamps.
  - `updatedAt`: `Date`, added by timestamps.
- Schema options: `{ timestamps: true }`.
- Indexes:
  - Text index `{ name: "text", email: "text" }`
  - Compound index `{ role: 1, accountStatus: 1, createdAt: -1 }`
  - Compound index `{ email: 1, role: 1 }`
  - Inline indexes on `role`, `accountStatus`, `isVerified`, `isActive`; unique inline index on `email`.
- Relationships: none declared with `ref`.
- Hooks: none.

### `src/Model/Category.ts`

- Model name: `Category`
- Interface: `ICategory extends Document`
- Fields:
  - `name`: `String`, required, trim, unique.
  - `slug`: `String`, required, unique, indexed, lowercase.
  - `description`: `String`, optional, maxlength `200`.
  - `isActive`: `Boolean`, default `true`.
  - `createdAt`: `Date`, added by timestamps.
  - `updatedAt`: `Date`, added by timestamps.
- Schema options: `{ timestamps: true }`.
- Indexes:
  - Inline unique index on `name`.
  - Inline unique/indexed field `slug`.
- Relationships: none declared with `ref`.
- Hooks: none.

### `src/Model/Article.ts`

- Model name: `Article`
- Types:
  - `ArticleStatus`: `draft`, `in_review`, `scheduled`, `published`, `archived`.
  - `ICoverImage`: `url`, optional `alt`, optional `caption`.
  - `ISeo`: optional `metaTitle`, `metaDescription`, `ogImage`, `keywords`.
  - `IEditHistoryEntry`: `editedBy`, `editedAt`, optional `note`.
- Fields:
  - `title`: `String`, required, trim.
  - `slug`: `String`, required, unique, indexed, lowercase.
  - `excerpt`: `String`, optional, maxlength `300`.
  - `content`: `String`, required.
  - `coverImage`: subdocument with `_id: false`:
    - `url`: `String`, required.
    - `alt`: `String`, optional.
    - `caption`: `String`, optional.
  - `category`: `Schema.Types.ObjectId`, ref `Category`, required.
  - `tags`: array of `Schema.Types.ObjectId`, ref `Tag`.
  - `author`: `Schema.Types.ObjectId`, ref `User`, required.
  - `coAuthors`: array of `Schema.Types.ObjectId`, ref `User`.
  - `status`: `String`, enum `draft`, `in_review`, `scheduled`, `published`, `archived`; default `draft`; indexed.
  - `publishedAt`: `Date`, optional, indexed.
  - `scheduledAt`: `Date`, optional.
  - `isBreaking`: `Boolean`, default `false`.
  - `isFeatured`: `Boolean`, default `false`.
  - `views`: `Number`, default `0`.
  - `likes`: `Number`, default `0`.
  - `shares`: `Number`, default `0`.
  - `readTime`: `Number`, optional.
  - `seo`: subdocument with `_id: false`:
    - `metaTitle`: `String`, optional.
    - `metaDescription`: `String`, optional.
    - `ogImage`: `String`, optional.
    - `keywords`: `[String]`, optional.
  - `relatedArticles`: array of `Schema.Types.ObjectId`, ref `Article`.
  - `editHistory`: array of subdocuments with `_id: false`:
    - `editedBy`: `Schema.Types.ObjectId`, ref `User`, required.
    - `editedAt`: `Date`, default `Date.now`.
    - `note`: `String`, optional.
  - `createdAt`: `Date`, added by timestamps.
  - `updatedAt`: `Date`, added by timestamps.
- Schema options: `{ timestamps: true }`.
- Indexes:
  - Text index `{ title: "text", content: "text" }`.
  - Compound index `{ category: 1, publishedAt: -1 }`.
  - Inline unique/indexed field `slug`.
  - Inline indexes on `status` and `publishedAt`.
- Relationships:
  - `category` -> `Category`
  - `tags` -> `Tag` (no `Tag` model exists in `src/Model`)
  - `author` -> `User`
  - `coAuthors` -> `User`
  - `relatedArticles` -> `Article`
  - `editHistory.editedBy` -> `User`
- Hooks:
  - `pre("save")`: if `content` is modified, strips HTML tags, counts words, and sets `readTime` to at least 1 minute using `Math.ceil(wordCount / 200)`.
  - `pre("save")`: if `status` changed to `published` and `publishedAt` is unset, sets `publishedAt` to current date.

### `src/Model/HomepageLayout.ts`

- Model name: `HomepageLayout`
- Interface: `IHomepageLayout extends Document`
- Imports `@/Model/Article` to register the referenced model.
- Fields:
  - `slots.hero_main`: `Schema.Types.ObjectId`, ref `Article`, required.
  - `slots.hero_sidebar_1`: `Schema.Types.ObjectId`, ref `Article`, required.
  - `slots.hero_sidebar_2`: `Schema.Types.ObjectId`, ref `Article`, required.
  - `slots.politics_featured`: `Schema.Types.ObjectId`, ref `Article`, required.
  - `slots.sports_featured`: `Schema.Types.ObjectId`, ref `Article`, required.
  - `updatedBy`: `String`, required.
  - `createdAt`: `Date`, added by timestamps.
  - `updatedAt`: `Date`, added by timestamps.
- Schema options: `{ timestamps: true }`.
- Indexes: none explicitly defined.
- Relationships:
  - All `slots.*` fields ref `Article`.
- Hooks: none.

## 4. API Routes

### `/api/health` from `src/app/api/health/route.ts`

- Methods: `GET`
- Auth/roles: none.
- Request params/body: none.
- Behavior/models/services:
  - Calls `connectDB()`.
  - Checks `mongoose.connection.readyState`.
  - Pings MongoDB admin connection when connected.
- Response shape:
  - Success `200`: `{ status: "ok", timestamp, uptime, responseTime, services: { database: { status: "connected", latency } } }`
  - Failure `503`: same shape with `status: "error"` and database status/message.

### `/api/auth/[...nextauth]` from `src/app/api/auth/[...nextauth]/route.ts`

- Methods: `GET`, `POST` exported from NextAuth `handlers`.
- Auth/roles: NextAuth internal route.
- Request params/body: handled by NextAuth.
- Models/services: `@/lib/auth`, which uses credentials provider, MongoDB, User model, bcrypt.
- Response shape: NextAuth-managed.

### `/api/auth/register` from `src/app/api/auth/register/route.ts`

- Methods: `POST`
- Auth/roles: public.
- Request body: `{ name, email, password }`.
- Validation:
  - Missing name/email/password -> `400`.
  - Existing email -> `409`.
- Behavior/models/services:
  - `connectDB()`.
  - `User.findOne({ email })`.
  - Hashes password with bcrypt salt rounds `10`.
  - First user in database becomes `admin`; later users become `reader`.
  - Creates `User`.
- Response shape:
  - Success `201`: `{ success: true, data: { id, name, email, role } }`
  - Error: `{ success: false, message }`

### `/api/categories` from `src/app/api/categories/route.ts`

- Methods: `GET`, `POST`
- `GET`:
  - Auth/roles: public.
  - Request params/body: none.
  - Models/services: `connectDB()`, `Category.find({ isActive: true }).sort({ name: 1 })`.
  - Success `200`: `{ success: true, data: categories }`
  - Error `500`: `{ success: false, message }`
- `POST`:
  - Auth/roles: `auth()` required; role must be `admin` or `editor`.
  - Request body: `{ name, slug, description }`.
  - Validation:
    - Missing name/slug -> `400`.
    - Duplicate lowercase slug -> `400`.
  - Models/services: `Category`.
  - Success `201`: `{ success: true, data: newCategory }`
  - Error: `{ success: false, message }`

### `/api/categories/seed` from `src/app/api/categories/seed/route.ts`

- Methods: `POST`
- Auth/roles: comment says admin-only, but no `auth()` or role check is implemented.
- Request params/body: request object is accepted but not used.
- Behavior/models/services:
  - `connectDB()`.
  - Defines eight core categories with slugs: `national`, `politics`, `international`, `economy`, `sports`, `entertainment`, `tech`, `lifestyle`.
  - For each category, updates existing by slug or creates it.
- Response shape:
  - Success `201`: `{ success: true, message, data: [{ slug, action: "updated" | "created" }] }`
  - Error `500`: `{ success: false, message }`

### `/api/articles` from `src/app/api/articles/route.ts`

- Methods: `GET`, `POST`
- Runtime: `nodejs`
- `GET`:
  - Auth/roles: optional session. Public users see only published articles. Admin/editor can request all statuses or any status. Writer can request all or a specific status but is restricted to own articles.
  - Query params:
    - `page`: default `1`, minimum `1`.
    - `limit`: default `10`, min `1`, max `100`.
    - `category`: category slug.
    - `status`: default `published`; supports `all` and specific status strings.
  - Models/services:
    - `auth()`, `connectDB()`.
    - `Category.findOne({ slug: categorySlug, isActive: true })`.
    - `Article.find(query).sort({ publishedAt: -1, createdAt: -1 }).skip().limit().populate("category", "name slug").populate("author", "name image").lean()`.
    - `Article.countDocuments(query)`.
  - Response shape:
    - Success `200`: `{ success: true, data: articles, meta: { total, page, limit, totalPages } }`
    - Category not found: success with empty `data` and zero totals.
    - Error `500`: `{ success: false, message }`
- `POST`:
  - Auth/roles: authenticated role must be `admin`, `editor`, or `writer`.
  - Request body fields:
    - Required: `title`, `content`, `category`.
    - Optional: `tags`, `coverImage`, `seo`, `status` default `draft`, `isBreaking`, `isFeatured`.
  - Validation:
    - Missing title/content/category -> `400`.
    - Writer cannot set `status: "published"` -> `403`.
    - Category must exist by id -> `400`.
  - Behavior:
    - Generates slug with `slugify(title, { lower: true, strict: true })`.
    - Falls back to `news-${Date.now()}` if slug is empty or `-`.
    - Adds random suffix if slug exists.
    - Creates `Article` with current user as `author`.
    - Defaults `coverImage` to `{ url: "/default-news.jpg" }` if absent.
    - Only admin/editor can set `isBreaking` and `isFeatured`.
    - Adds initial `editHistory` entry.
  - Response shape:
    - Success `201`: `{ success: true, message, data: { id, slug } }`
    - Error: `{ success: false, message }`

### `/api/articles/[id]` from `src/app/api/articles/[id]/route.ts`

- Methods: `GET`, `PUT`
- Runtime: `nodejs`
- Params: `id` is awaited from `params`; if valid ObjectId, lookup uses `$or: [{ _id: id }, { slug: id }]`; otherwise `{ slug: id }`.
- `GET`:
  - Auth/roles: optional. Unpublished article is visible only to admin/editor or owning writer. Public users can only see published articles.
  - Models/services:
    - `auth()`, `connectDB()`.
    - `Article.findOne(...).populate("category", "name slug").populate("author", "name image").lean()`.
  - Response shape:
    - Success `200`: `{ success: true, data: article }`
    - Not found or unauthorized unpublished article: `{ success: false, message: "Article not found." }` with `404`.
    - Error `500`: `{ success: false, message }`
- `PUT`:
  - Auth/roles: authenticated role must be `admin`, `editor`, or `writer`.
  - Writer can only edit own articles.
  - Writer cannot publish directly.
  - Request body:
    - Optional `title`, `content`, `category`, `tags`, `coverImage`, `seo`, `status`, `isBreaking`, `isFeatured`, `editNote`.
  - Validation:
    - Invalid/no session -> `401`.
    - Invalid role -> `403`.
    - Missing user id -> `401`.
    - Article not found -> `404`.
    - Writer editing another author's article -> `403`.
    - Writer setting `published` -> `403`.
    - Invalid status -> `400`.
    - Invalid category id or missing category -> `400`.
    - Invalid tag id -> `400`.
  - Behavior:
    - Updates provided fields.
    - Only admin/editor can modify `isBreaking` and `isFeatured`.
    - Pushes edit history entry with current user id and note.
    - Saves article, triggering pre-save hooks.
  - Response shape:
    - Success `200`: `{ success: true, message, data: { id, slug, status } }`
    - Error: `{ success: false, message }`

### `/api/admin/homepage-layout` from `src/app/api/admin/homepage-layout/route.ts`

- Methods: `GET`, `PUT`
- Auth/roles: none implemented in the route.
- `GET`:
  - Request params/body: none.
  - Models/services:
    - `connectDB()`.
    - Reads Redis key `cached_homepage_layout`.
    - Falls back to `HomepageLayout.findOne().populate(slots.*).lean()`.
    - Writes populated `layout.slots` to Redis for 3600 seconds on DB fallback.
  - Response shape:
    - Success: `{ success: true, data }`
    - If no layout: `{ success: true, data: { hero_main: null, hero_sidebar_1: null, hero_sidebar_2: null, politics_featured: null, sports_featured: null } }`
    - Error `500`: `{ success: false, error }`
- `PUT`:
  - Request body: `{ slots, userId }`.
  - Behavior/models/services:
    - `connectDB()`.
    - `HomepageLayout.findOneAndUpdate({}, { slots, updatedBy: userId }, { new: true, upsert: true })`.
    - Re-fetches populated layout.
    - Caches `populatedLayout.slots` in Redis key `cached_homepage_layout` for 3600 seconds.
    - Calls `revalidatePath("/")`.
  - Response shape:
    - Success: `{ success: true, data: updatedLayout.slots }`
    - Error `500`: `{ success: false, error }`

### `/api/admin/users` from `src/app/api/admin/users/route.ts`

- Methods: `GET`, `POST`
- Runtime: `nodejs`
- Auth/roles: local `requireAdmin()` uses `auth()`; requires authenticated `admin`.
- `GET`:
  - Query params:
    - `page`: default `1`.
    - `limit`: default `20`, max `100`.
    - `search`: optional name/email search.
    - `role`: optional `all` or one of role values.
    - `status`: optional `all` or `active`, `inactive`, `suspended`.
  - Behavior/models/services:
    - Queries `User` with filters.
    - Selects user public fields, sorts newest first, paginates.
    - Counts articles by author via `Article.aggregate`.
    - Computes metrics: total staff, active writers, inactive accounts as pending approvals, suspended accounts.
  - Response shape:
    - Success: `{ success: true, data, meta: { total, page, limit, totalPages }, metrics: { totalStaff, activeWriters, pendingApprovals, suspendedAccounts } }`
    - Unauthenticated `401`: `{ success: false, message: "Authentication required." }`
    - Non-admin `403`: `{ success: false, message: "Admin access required." }`
    - Error `500`: `{ success: false, message }`
- `POST`:
  - Request body: `{ name?, email?, role?, password? }`.
  - Defaults role to `writer`.
  - Validates name/email/role; duplicate email returns `409`.
  - Password is either provided with length >= 8 or generated with `crypto.randomUUID()`, then hashed with bcrypt.
  - Creates active unverified user.
  - Response shape:
    - Success `201`: `{ success: true, data: { id, name, email, role, status, isVerified, avatar, articlesCount, createdAt, updatedAt } }`
    - Error: `{ success: false, message }`

### `/api/admin/users/[id]` from `src/app/api/admin/users/[id]/route.ts`

- Methods: `PATCH`
- Runtime: `nodejs`
- Auth/roles: local `requireAdmin()` uses `auth()`; requires authenticated `admin`.
- Params: `id`.
- Request body: `{ role?, status? }`.
- Validation:
  - Cannot modify own account -> `400`.
  - Invalid role -> `400`.
  - Invalid status -> `400`.
  - No valid updates -> `400`.
  - User not found -> `404`.
- Behavior/models/services:
  - `User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })`.
  - When `status` is updated, also sets `isActive` to `status === "active"`.
- Response shape:
  - Success: `{ success: true, data: { id, name, email, role, status, isVerified, avatar, createdAt, updatedAt } }`
  - Auth errors: `{ success: false, message }` with `401`/`403`.
  - Other errors: `{ success: false, message }`

## 5. Authentication & Authorization

- Auth library: NextAuth v5 beta.
- Auth config:
  - Main config in `src/lib/auth.ts`.
  - Middleware-compatible config in `src/lib/auth.config.ts`.
  - Credentials provider only.
  - Credentials expected: `email`, `password`.
  - Authorization:
    - Connects to MongoDB.
    - Finds `User` by email.
    - Compares password using bcrypt.
    - Returns `{ id, name, email, role }` when valid.
  - Session strategy: JWT.
  - JWT callback stores `token.id` and `token.role`.
  - Session callback writes `session.user.id` and `session.user.role`.
  - Sign-in page: `/login`.
- Type augmentation:
  - `src/types/next-auth.d.ts` extends `User`, `Session.user`, and `JWT` with `id` and `role`.
- Roles:
  - Defined in `src/constant/roles.ts`: `admin`, `editor`, `writer`, `reader`.
- Route helper:
  - `src/lib/dashboardRoutes.ts`
    - `admin` -> `/admin/dashboard`
    - `editor` -> `/editor`
    - `writer` -> `/write`
    - `reader` -> `/`
    - Includes `normalizeRole()` and `hasAnyRole()`.
- `src/lib/requireRole.ts`:
  - Generic helper returning `{ session, error }`.
  - Returns `401` JSON when unauthenticated and `403` JSON when role not allowed.
  - Present but not used in current API routes found.
- Middleware:
  - `src/middleware.ts` uses `NextAuth(authConfig)` and exports `auth((req) => ...)`.
  - Matcher: `/admin/:path*`, `/editor/:path*`, `/write/:path*`, `/writer/:path*`.
  - Unauthenticated users accessing `/admin`, `/editor`, `/writer` are redirected to `/login`.
  - Note: unauthenticated `/write` is matched but the unauthenticated check does not include `/write`; role-specific checks below still run only after `user` exists, so `/write` unauthenticated behavior is handled by the page/layout rather than the first middleware branch.
  - `/editor` and `/editor/dashboard` require role `editor`; others redirect to role dashboard.
  - `/write` and `/writer` require role `writer`; others redirect to role dashboard.
  - `/admin/dashboard` and `/admin/users` require role `admin`.
  - Other `/admin` paths allow `admin`, `editor`, or `writer`; users without these roles redirect to `/`.
- Layout/page-level checks:
  - `src/app/(admin)/admin/layout.tsx`: requires any session, wraps `DashboardShell`.
  - `src/app/(admin)/admin/dashboard/page.tsx`: requires admin.
  - `src/app/(admin)/editor/layout.tsx`: requires editor.
  - `src/app/(admin)/editor/page.tsx`: requires editor.
  - `src/app/(admin)/editor/dashboard/page.tsx`: requires editor then redirects `/editor`.
  - `src/app/(admin)/write/layout.tsx`: requires writer.
  - `src/app/(admin)/write/page.tsx`: requires writer.
  - `src/app/(admin)/writer/layout.tsx`: requires writer.
  - `src/app/(admin)/writer/dashboard/page.tsx`: requires writer then redirects `/write`.
  - `src/app/(admin)/admin/articles/[id]/page.tsx`: unpublished article details visible only to admin/editor or owning writer.
- API-level checks:
  - `/api/articles` GET uses optional auth for status scoping.
  - `/api/articles` POST requires admin/editor/writer.
  - `/api/articles/[id]` GET protects unpublished content.
  - `/api/articles/[id]` PUT requires admin/editor/writer and enforces writer ownership.
  - `/api/categories` POST requires admin/editor.
  - `/api/admin/users` and `/api/admin/users/[id]` require admin.
  - `/api/admin/homepage-layout` has no route-level auth check.
  - `/api/categories/seed` has no route-level auth check despite comment stating admin-only.

## 6. Pages & Routing

Route groups are omitted from URL paths.

- `src/app/page.tsx` -> `/`
  - Server Component.
  - Public.
  - Renders public `Header` Client Component and `PublicHomepage` Server Component.
- `src/app/(public)/articles/page.tsx` -> `/articles`
  - Server Component.
  - Public.
  - Direct DB query for latest published articles.
- `src/app/(public)/news/[id]/page.tsx` -> `/news/[id]`
  - Server Component.
  - Public.
  - Uses `getCachedArticle(id)` and `notFound()` when absent.
  - Exports `dynamicParams = true`.
- `src/app/(auth)/login/page.tsx` -> `/login`
  - Client Component (`"use client"`).
  - Public auth page.
  - Uses `signIn("credentials")`, `getSession()`, router navigation.
- `src/app/(auth)/register/page.tsx` -> `/register`
  - Client Component.
  - Public auth page.
  - Calls `/api/auth/register`, then signs in with credentials.
- `src/app/(admin)/admin/dashboard/page.tsx` -> `/admin/dashboard`
  - Server Component.
  - Protected admin.
  - Auth/role checks inside page.
- `src/app/(admin)/admin/articles/page.tsx` -> `/admin/articles`
  - Server Component importing Client Component `ArticleListTable`.
  - Protected by admin layout/middleware for admin/editor/writer.
- `src/app/(admin)/admin/articles/[id]/page.tsx` -> `/admin/articles/[id]`
  - Server Component.
  - Protected article details page with unpublished visibility checks.
- `src/app/(admin)/admin/edit/[id]/page.tsx` -> `/admin/edit/[id]`
  - Server Component importing Client Component `ArticleForm`.
  - Protected by admin layout/middleware.
  - Fetches article by ObjectId and passes serialized `initialData`.
- `src/app/(admin)/admin/homepage-curator/page.tsx` -> `/admin/homepage-curator`
  - Client Component.
  - Protected by admin layout/middleware for admin/editor/writer, but sidebar exposes it only for admin.
  - Fetches articles and homepage layout client-side.
- `src/app/(admin)/admin/new/page.tsx` -> `/admin/new`
  - Server Component importing Client Component `ArticleForm`.
  - Protected by admin layout/middleware.
- `src/app/(admin)/admin/users/page.tsx` -> `/admin/users`
  - Client Component.
  - Protected admin by middleware and API.
  - Uses shadcn `Button`.
- `src/app/(admin)/editor/page.tsx` -> `/editor`
  - Server Component.
  - Protected editor.
  - Renders `RoleDashboardHome role="editor"`.
- `src/app/(admin)/editor/dashboard/page.tsx` -> `/editor/dashboard`
  - Server Component.
  - Protected editor.
  - Redirects to `/editor`.
- `src/app/(admin)/write/page.tsx` -> `/write`
  - Server Component.
  - Protected writer.
  - Renders `RoleDashboardHome role="writer"`.
- `src/app/(admin)/writer/dashboard/page.tsx` -> `/writer/dashboard`
  - Server Component.
  - Protected writer.
  - Redirects to `/write`.

Layouts:
- `src/app/layout.tsx`: root Server Component layout, `html lang="bn"`, wraps all children in client `AuthProvider`.
- `src/app/(public)/layout.tsx`: public Server Component layout with public `Header`.
- `src/app/(admin)/admin/layout.tsx`: protected admin Server Component layout with `DashboardShell`.
- `src/app/(admin)/editor/layout.tsx`: protected editor Server Component layout.
- `src/app/(admin)/write/layout.tsx`: protected writer Server Component layout.
- `src/app/(admin)/writer/layout.tsx`: protected writer alias Server Component layout.

## 7. Shared Components

### `src/components/Home/`

- `Home.tsx`: Server Component that reads `cached_homepage_layout` from Redis, falls back to MongoDB `HomepageLayout`, and renders placeholder top-news content. It is imported but commented out in `src/app/page.tsx`.
- `Home2.tsx`: Server Component used by `/`. Reads homepage slots from Redis/MongoDB, normalizes article data, and renders the main public homepage with hero story, sidebar stories, and category feature sections using `next/image` and `next/link`.

### `src/components/layout/`

- `header.tsx`: Client Component public header. Uses `useSession()`, `signOut()`, date formatting in `useEffect`, mobile menu state, profile dropdown, logo, static nav links, login/dashboard links, and lucide icons.

### `src/components/providers/`

- `AuthProvider.tsx`: Client Component wrapping children in NextAuth `SessionProvider`.

### `src/components/admin/`

- `DashboardShell.tsx`: Client Component for admin/editor/writer shell. Uses `useSession`, redirects unauthenticated users, fetches article count from `/api/articles?page=1&limit=1&status=all`, filters `NAV_CONFIG` by user role, and renders responsive `Sidebar`, admin `Header`, and page content.
- `Sidebar.tsx`: Client Component rendering role-specific grouped navigation items, active state, badges, and user profile footer.
- `Header.tsx`: Client Component rendering dashboard topbar, search input, notification icon, user dropdown, and sign out.
- `RoleDashboardHome.tsx`: Server Component rendering editor/writer role landing cards with role-specific links.
- `ArticleForm.tsx`: Client Component used for new/edit article workflows. Fetches categories, handles title/content/category/status/flags/cover image/edit note form state, uploads images to ImgBB, calls `/api/articles` POST or `/api/articles/[id]` PUT, and redirects to role dashboard.
- `ArticleListTable.tsx`: Client Component fetching `/api/articles?page=N&limit=10&status=all`, rendering article table with status badges, edit/detail links, loading state, and pagination.
- `RichTextEditor.tsx`: Client Component wrapping Tiptap editor with StarterKit, Link, and Image extensions. Emits HTML via `onChange`, includes toolbar actions for formatting, headings, lists, blockquote, image URL prompt, undo, redo.

### `src/components/ui/`

- `button.tsx`: shadcn-style `Button` component built on `@base-ui/react/button`, `class-variance-authority`, and `cn()`. Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
- shadcn component usage found:
  - `src/app/(admin)/admin/users/page.tsx` imports and uses `Button`.
  - `src/components/ui/button.tsx` is the only `src/components/ui` component currently present.

## 8. State Management & Data Fetching

- Global state/providers:
  - NextAuth session state is exposed through `SessionProvider` in `src/components/providers/AuthProvider.tsx`, mounted by root layout.
  - No Redux, Zustand, SWR, or React Query usage is present.
- Server-side data fetching:
  - Public homepage (`Home2.tsx`) reads Redis directly, falls back to MongoDB via Mongoose.
  - Public articles page queries MongoDB directly in a Server Component.
  - Public news detail uses `getCachedArticle()` from `src/lib/newsService.ts`.
  - Admin article detail/edit pages query MongoDB directly in Server Components.
  - Admin/editor/writer layouts and pages use `auth()` server-side for protection.
- Client-side data fetching:
  - `ArticleForm` fetches `/api/categories` and submits to article APIs.
  - `ArticleListTable` fetches `/api/articles`.
  - `DashboardShell` fetches article count through `/api/articles`.
  - `HomepageCurator` fetches `/api/articles?limit=10` and `/api/admin/homepage-layout`, then PUTs layout updates.
  - `UserManagementPage` fetches `/api/admin/users`, POSTs new users, PATCHes `/api/admin/users/[id]`.
  - Login/register pages use NextAuth client helpers and registration API.
- Caching:
  - Redis client in `src/lib/redis.ts` requires Upstash REST URL/token.
  - Homepage layout cache key: `cached_homepage_layout`, TTL 3600 seconds in `/api/admin/homepage-layout`.
  - Article detail Redis cache key: `cached_article_${slug}`, TTL 300 seconds in `newsService`.
  - `getCachedArticle` wraps DB/Redis fetch in Next.js `unstable_cache` with key `["article-details"]`, `revalidate: 60`, and tag `["articles"]`.
  - Homepage layout PUT calls `revalidatePath("/")`.
  - No `revalidateTag` usage is present.

## 9. Internationalization

- No `next-intl` dependency is present in `package.json`.
- No locale routing folders such as `[locale]` are present.
- No translation files were found under `src/`.
- Root HTML is `lang="bn"` in `src/app/layout.tsx`.
- UI strings are a mix of Bengali text and English labels directly embedded in components/pages.
- `Header` formats current date with `toLocaleDateString("bn-BD", options)`.
- Public news detail formats publication date with locale `"bn-BD"`.

## 10. Environment Variables

- `MONGODB_URI`
  - Referenced in `src/lib/db.ts`.
  - Used by `mongoose.connect()` for the MongoDB connection.
  - Missing value throws `Please define the MONGODB_URI environment variable`.
- `UPSTASH_REDIS_REST_URL`
  - Referenced in `src/lib/redis.ts`.
  - Used to configure Upstash Redis REST client.
  - Missing value throws `Missing Upstash Redis environment variables`.
- `UPSTASH_REDIS_REST_TOKEN`
  - Referenced in `src/lib/redis.ts`.
  - Used to configure Upstash Redis REST client auth token.
  - Missing value throws `Missing Upstash Redis environment variables`.

No actual environment variable values are included here.

## 11. Third-party Integrations

- MongoDB/Mongoose:
  - Configured in `src/lib/db.ts`.
  - Used by all models in `src/Model` and route/page data loading.
- NextAuth:
  - Configured in `src/lib/auth.ts` and `src/lib/auth.config.ts`.
  - Route handler in `src/app/api/auth/[...nextauth]/route.ts`.
  - Client provider in `src/components/providers/AuthProvider.tsx`.
- Upstash Redis:
  - Configured in `src/lib/redis.ts`.
  - Used for homepage layout cache and article detail cache.
- ImgBB:
  - Client-side upload in `src/components/admin/ArticleForm.tsx` using endpoint `https://api.imgbb.com/1/upload`.
  - API key is hardcoded in the component as `IMGBB_API_KEY`; not sourced from `process.env`.
  - `next.config.ts` allows images from `i.ibb.co` and wildcard `*.ibb.co`.
- Tiptap:
  - Used in `src/components/admin/RichTextEditor.tsx` with StarterKit, Link, and Image extensions.
- Framer Motion:
  - Used by login and register pages for entry/error animations.
- lucide-react:
  - Used broadly for public header, admin shell, forms, lists, dashboard, and user management icons.
- Base UI / shadcn:
  - `src/components/ui/button.tsx` wraps `@base-ui/react/button`.

## 12. Known Gaps / TODOs

- `src/app/api/categories/seed/route.ts` comment says the endpoint is admin-only, but no authentication or role check is implemented.
- `src/app/api/admin/homepage-layout/route.ts` has no authentication or role checks, although it updates homepage configuration and cache.
- `src/app/(admin)/admin/homepage-curator/page.tsx` sends `userId: "editor_session_id_123"` with a comment indicating it should come from auth dynamically.
- `src/components/admin/ArticleForm.tsx` contains a hardcoded ImgBB API key instead of using an environment variable.
- `src/Model/Article.ts` references `Tag` in `tags`, but no `Tag` model file exists in `src/Model`.
- `src/infrastructure/config/nav.config.ts` includes links to `/admin/comments` and `/dashboard/profile`, but no corresponding page files exist in `src/app`.
- `src/components/Home/Home.tsx` is an incomplete/placeholder homepage component with comment `Your homepage layout mapping here`; it is imported but commented out in `src/app/page.tsx`.
- `src/app/(admin)/admin/edit/[id]/page.tsx` contains `console.log("id is ", id);`.
- `src/app/(admin)/admin/articles/[id]/page.tsx` contains a no-op `console.log;`.
- `src/components/admin/ArticleForm.tsx` has `author` and `coAuthor` form state and sends them in payload, but the article creation/update API does not read `author` or `coAuthor` from the request body; server-side author is taken from session and `coAuthors` is not updated from that form field.
- `src/app/page.tsx` imports `HomePage` and `Image` but does not use them; `HomePage` is commented out.
- `src/app/layout.tsx` imports/configures Geist, Geist_Mono, and Inter variables but only applies Hind Siliguri to `<html>`.
- `src/app/(admin)/admin/dashboard/page.tsx` imports `ArticleForm` and `ArticleListTable` but does not use them.
- `src/app/(public)/news/[id]/page.tsx` imports `Link` but does not use it.
- `src/components/admin/RichTextEditor.tsx` defines `MenuButton` inside render and types its props as `any`; current lint output flags this pattern.
- Root utility scripts `inspect-categories.cjs` and `temp-create-user.cjs` use CommonJS `require`; current lint output flags them.
- Current lint state from `npm run lint` includes many pre-existing errors across unrelated files; a targeted lint of `src/components/Home/Home2.tsx` passed after the latest homepage serialization fix.

## 13. Current File Inventory

- `src/app/(admin)/admin/articles/[id]/page.tsx`
- `src/app/(admin)/admin/articles/page.tsx`
- `src/app/(admin)/admin/dashboard/page.tsx`
- `src/app/(admin)/admin/edit/[id]/page.tsx`
- `src/app/(admin)/admin/homepage-curator/page.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/new/page.tsx`
- `src/app/(admin)/admin/users/page.tsx`
- `src/app/(admin)/editor/dashboard/page.tsx`
- `src/app/(admin)/editor/layout.tsx`
- `src/app/(admin)/editor/page.tsx`
- `src/app/(admin)/write/layout.tsx`
- `src/app/(admin)/write/page.tsx`
- `src/app/(admin)/writer/dashboard/page.tsx`
- `src/app/(admin)/writer/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(public)/articles/page.tsx`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/news/[id]/page.tsx`
- `src/app/api/admin/homepage-layout/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/articles/[id]/route.ts`
- `src/app/api/articles/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/categories/seed/route.ts`
- `src/app/api/health/route.ts`
- `src/app/favicon.ico`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/Home/Home.tsx`
- `src/components/Home/Home2.tsx`
- `src/components/admin/ArticleForm.tsx`
- `src/components/admin/ArticleListTable.tsx`
- `src/components/admin/DashboardShell.tsx`
- `src/components/admin/Header.tsx`
- `src/components/admin/RichTextEditor.tsx`
- `src/components/admin/RoleDashboardHome.tsx`
- `src/components/admin/Sidebar.tsx`
- `src/components/layout/header.tsx`
- `src/components/providers/AuthProvider.tsx`
- `src/components/ui/button.tsx`
- `src/constant/roles.ts`
- `src/infrastructure/config/nav.config.ts`
- `src/lib/auth.config.ts`
- `src/lib/auth.ts`
- `src/lib/dashboardRoutes.ts`
- `src/lib/db.ts`
- `src/lib/newsService.ts`
- `src/lib/redis.ts`
- `src/lib/requireRole.ts`
- `src/lib/utils.ts`
- `src/middleware.ts`
- `src/Model/Article.ts`
- `src/Model/Category.ts`
- `src/Model/HomepageLayout.ts`
- `src/Model/User.ts`
- `src/types/next-auth.d.ts`
