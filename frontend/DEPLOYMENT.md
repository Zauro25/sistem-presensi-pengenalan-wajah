# Production Deployment Guide

## Environment Configuration

### Development
`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Production
`.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Build & Deploy

### Option 1: Vercel (Recommended)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Add frontend"
git push
```

2. **Connect to Vercel**:
- Go to https://vercel.com
- Import repository
- Set environment variable: `NEXT_PUBLIC_API_URL`
- Deploy

3. **Custom Domain** (optional):
- Add domain in Vercel dashboard
- Update DNS records

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Update `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

Build & run:
```bash
docker build -t absensi-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api absensi-frontend
```

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone & Build**:
```bash
git clone your-repo
cd frontend
npm install
npm run build
```

3. **Run with PM2**:
```bash
npm install -g pm2
pm2 start npm --name "absensi-frontend" -- start
pm2 save
pm2 startup
```

4. **Nginx Reverse Proxy**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## CORS Configuration

Ensure backend allows frontend domain in `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://yourdomain.com",  # Production
]
```

## Security Checklist

### Frontend
- ✅ Use HTTPS in production
- ✅ Set secure environment variables
- ✅ Enable Content Security Policy
- ✅ Use proper CORS headers
- ✅ Validate all user inputs
- ✅ Don't expose sensitive data in client

### Backend
- ✅ Use HTTPS
- ✅ Set proper CORS origins
- ✅ Use secure session settings
- ✅ Enable CSRF protection
- ✅ Rate limit API endpoints
- ✅ Validate file uploads

## Performance Optimization

### 1. Enable Next.js Optimizations

Update `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  images: {
    formats: ['image/webp'],
  },
  poweredByHeader: false,
};

export default nextConfig;
```

### 2. Add Caching Headers

In Nginx:
```nginx
location /_next/static/ {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 365d;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### 3. Enable Compression

In Nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## Monitoring

### 1. Add Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

Initialize:
```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "your-sentry-dsn",
  tracesSampleRate: 1.0,
});
```

### 2. Add Analytics (Google Analytics)

```javascript
// app/layout.js
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_ID');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

## Backup Strategy

### 1. Code Backups
- Git repository (GitHub/GitLab)
- Regular commits
- Tagged releases

### 2. Database Backups
- Regular PostgreSQL dumps
- Automated daily backups
- Off-site storage

### 3. Media Files
- S3/DigitalOcean Spaces
- Regular sync
- Versioning enabled

## Health Checks

Add health check endpoint:

```javascript
// app/api/health/route.js
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

## Docker Compose (Full Stack)

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/absensi
    depends_on:
      - db

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=absensi
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

## Deployment Checklist

Before going live:

- [ ] Set production environment variables
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Add error monitoring
- [ ] Configure logging
- [ ] Test all features in staging
- [ ] Set up CI/CD pipeline
- [ ] Configure domain DNS
- [ ] Set up SSL certificates
- [ ] Enable rate limiting
- [ ] Add uptime monitoring
- [ ] Document deployment process
- [ ] Train admin users
- [ ] Prepare rollback plan

## Maintenance

### Regular Tasks
- Monitor error logs
- Check uptime reports
- Review performance metrics
- Update dependencies monthly
- Backup verification
- Security patches

### Updates

```bash
# Check outdated packages
npm outdated

# Update dependencies
npm update

# Test thoroughly
npm run build
npm start
```

## Support Contacts

- Frontend Issues: [Your contact]
- Backend Issues: [Your contact]
- Infrastructure: [Your contact]
- Emergency: [Your contact]

---

**Ready for Production! 🚀**
