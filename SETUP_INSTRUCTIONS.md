# Setup Instructions

## Issues Fixed

### 1. Frontend-Backend Connection
The frontend API client is configured to use `NEXT_PUBLIC_API_BASE` environment variable. You need to create a `.env.local` file in the `thrift-shop-app` directory.

### 2. Missing Pages
All missing pages have been created:
- ✅ Home page (`/`)
- ✅ Admin pages: `/admin/analytics`, `/admin/settings`
- ✅ Account pages: `/account/addresses`, `/account/payment`, `/account/notifications`, `/account/security`, `/account/settings`
- ✅ Vendor pages: `/vendor/orders`, `/vendor/analytics`, `/vendor/settings`

## Required Setup Steps

### Step 1: Create Frontend Environment File

Create a file `thrift-shop-app/.env.local` with the following content:

```env
# Frontend Environment Variables
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:3000/api/v1

# S3/MinIO Configuration (for image URLs)
NEXT_PUBLIC_S3_URL=http://localhost:9000/thriftshop
```

**Note:** The `.env.local` file is gitignored, so you need to create it manually.

### Step 2: Create Backend Environment File (if not exists)

Create a file `thrift-shop-api/.env` with the following content:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/thriftshop

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-at-least-64-characters-long-for-security-please-use-a-strong-random-string
JWT_EXPIRES_IN=7d

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=thriftshop

# Email (SendGrid) - Optional
SENDGRID_API_KEY=your-api-key
EMAIL_FROM=noreply@thriftshop.com

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
```

### Step 3: Start the Services

1. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```

2. **Start the backend:**
   ```bash
   cd thrift-shop-api
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```

3. **Start the frontend:**
   ```bash
   cd thrift-shop-app
   npm install
   npm run dev
   ```

### Step 4: Verify Connection

- Backend should be running at: `http://localhost:3000/api/v1`
- Frontend should be running at: `http://localhost:3001`
- Swagger docs: `http://localhost:3000/api/v1/docs`

## API Client Configuration

The frontend API client (`src/lib/apiClient.ts`) uses:
- Environment variable: `NEXT_PUBLIC_API_BASE`
- Default fallback: `http://localhost:3000/api/v1`

Make sure your `.env.local` file matches this configuration.

## New Pages Created

### Home Page
- Route: `/`
- Features: Hero section, featured products, value propositions, category links

### Admin Pages
- `/admin/analytics` - Platform analytics and metrics
- `/admin/settings` - Platform configuration and settings

### Account Pages
- `/account/addresses` - Manage shipping addresses
- `/account/payment` - Manage payment methods (placeholder for future integration)
- `/account/notifications` - Notification preferences
- `/account/security` - Password change and security settings
- `/account/settings` - General account settings

### Vendor Pages
- `/vendor/orders` - Manage vendor orders
- `/vendor/analytics` - Store analytics and insights
- `/vendor/settings` - Store configuration

## Notes

- Some pages have placeholder functionality (like payment methods) that will need API integration
- Chart visualizations in analytics pages are placeholders and will need chart library integration
- All pages follow the existing design patterns and use the same UI components

## Troubleshooting

If you still can't connect frontend to backend:

1. Check that both services are running
2. Verify the `.env.local` file exists and has the correct `NEXT_PUBLIC_API_BASE` value
3. Check browser console for CORS errors
4. Verify backend CORS configuration allows `http://localhost:3001`
5. Check network tab in browser dev tools to see if requests are being made

