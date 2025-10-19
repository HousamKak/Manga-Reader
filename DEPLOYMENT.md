# Deployment Guide

This document describes the CI/CD setup for deploying the Manga Reader application.

## Environments

### 1. **UAT (User Acceptance Testing)**
- **URL**: https://uat.manga.housamkak.com
- **Branch**: `develop`
- **Auto-deploy**: Yes, on push to `develop` branch
- **Purpose**: Testing new features before production release

### 2. **Production**
- **URL**: https://manga.housamkak.com (or GitHub Pages)
- **Branch**: `main`
- **Auto-deploy**: Yes, on push to `main` branch
- **Purpose**: Stable release for end users

## GitHub Secrets Configuration

### Required Secrets for UAT Deployment

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Server Connection Secrets
- **`UAT_SERVER_HOST`**: The hostname or IP address of your UAT server
  - Example: `uat.manga.housamkak.com` or `192.168.1.100`

- **`UAT_SERVER_USERNAME`**: SSH username for server access
  - Example: `deployer` or `ubuntu`

- **`UAT_SSH_PRIVATE_KEY`**: Private SSH key for authentication
  - Generate using: `ssh-keygen -t ed25519 -C "github-actions-uat"`
  - Copy the **private key** (`~/.ssh/id_ed25519`) content
  - Add the **public key** (`~/.ssh/id_ed25519.pub`) to server's `~/.ssh/authorized_keys`

- **`UAT_SSH_PORT`**: (Optional) SSH port number
  - Default: `22`
  - Only set if using custom SSH port

- **`UAT_DEPLOY_PATH`**: Absolute path on server where files should be deployed
  - Example: `/var/www/uat.manga.housamkak.com`
  - Example: `/home/deployer/uat-manga`

#### Supabase Configuration Secrets
- **`UAT_SUPABASE_URL`**: Your UAT Supabase project URL
  - Example: `https://abcdefghijklmn.supabase.co`
  - Get from: Supabase Dashboard → Project Settings → API

- **`UAT_SUPABASE_ANON_KEY`**: Your UAT Supabase anonymous key
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Get from: Supabase Dashboard → Project Settings → API → anon/public key

## Server Setup

### 1. Prerequisites on UAT Server

```bash
# Create deployment directory
sudo mkdir -p /var/www/uat.manga.housamkak.com
sudo chown $USER:$USER /var/www/uat.manga.housamkak.com

# Install Nginx (if not already installed)
sudo apt update
sudo apt install nginx -y
```

### 2. Nginx Configuration

Create `/etc/nginx/sites-available/uat.manga.housamkak.com`:

```nginx
server {
    listen 80;
    server_name uat.manga.housamkak.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name uat.manga.housamkak.com;

    # SSL Configuration (use certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/uat.manga.housamkak.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/uat.manga.housamkak.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/uat.manga.housamkak.com;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/uat.manga.housamkak.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate Setup

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d uat.manga.housamkak.com

# Auto-renewal is configured automatically
```

### 4. SSH Key Setup

On your local machine or where you generated the SSH key:

```bash
# Generate SSH key pair (if not already done)
ssh-keygen -t ed25519 -C "github-actions-uat"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub deployer@uat.manga.housamkak.com

# Test SSH connection
ssh -i ~/.ssh/id_ed25519 deployer@uat.manga.housamkak.com
```

## Supabase Setup

### 1. Create UAT Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project for UAT (e.g., "manga-reader-uat")
3. Wait for project initialization
4. Note down:
   - Project URL (Settings → API → Project URL)
   - Anon/Public Key (Settings → API → Project API keys → anon public)

### 2. Run Migrations

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to UAT project
supabase link --project-ref YOUR_UAT_PROJECT_REF

# Push migrations
supabase db push
```

Or run migrations directly in Supabase SQL Editor:
1. Copy content from `supabase/migrations/20251018010000_init.sql`
2. Paste and execute in SQL Editor

## Workflow Triggers

### UAT Deployment
- **Automatic**: Pushes to `develop` branch
- **Manual**: Go to Actions → Deploy to UAT → Run workflow

### Production Deployment (GitHub Pages)
- **Automatic**: Pushes to `main` branch
- **Manual**: Go to Actions → Deploy to GitHub Pages → Run workflow

## Monitoring Deployments

### View Deployment Status
1. Go to GitHub repository
2. Click "Actions" tab
3. Select the workflow run
4. View logs for each step

### Verify Deployment
- UAT: https://uat.manga.housamkak.com
- Production: https://manga.housamkak.com

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```
Error: Permission denied (publickey)
```
**Solution**:
- Verify `UAT_SSH_PRIVATE_KEY` secret contains the correct private key
- Ensure public key is in server's `~/.ssh/authorized_keys`
- Check file permissions: `chmod 600 ~/.ssh/authorized_keys`

#### 2. Deployment Path Not Found
```
Error: No such file or directory
```
**Solution**:
- Verify `UAT_DEPLOY_PATH` exists on server
- Create directory: `mkdir -p /var/www/uat.manga.housamkak.com`

#### 3. Build Failed
```
Error: Environment variable VITE_SUPABASE_URL is not set
```
**Solution**:
- Check GitHub Secrets are configured correctly
- Verify secret names match workflow file

#### 4. Nginx 404 Errors on SPA Routes
**Solution**:
- Ensure `try_files $uri $uri/ /index.html;` is in nginx config
- Reload nginx: `sudo systemctl reload nginx`

## Deployment Checklist

Before pushing to `develop` (UAT):
- [ ] All tests pass locally
- [ ] Code has been reviewed
- [ ] Feature branch merged to `develop`
- [ ] Supabase migrations tested locally
- [ ] Environment variables configured

Before merging to `main` (Production):
- [ ] UAT testing completed
- [ ] No critical bugs
- [ ] Performance tested
- [ ] Security reviewed
- [ ] Documentation updated

## Rollback Procedure

### UAT Rollback
1. Revert commit on `develop` branch
2. Force push: `git push origin develop`
3. CI/CD will auto-deploy previous version

### Manual Rollback
```bash
# SSH to server
ssh deployer@uat.manga.housamkak.com

# If you have backups
cd /var/www/uat.manga.housamkak.com
cp -r ../uat-backup-YYYYMMDD/* .

# Or redeploy specific commit
# Trigger workflow manually from GitHub Actions
```

## Environment Variables

### Build-time Variables (Required)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/public key

### Runtime Configuration
All configuration is baked into the build. No server-side environment variables needed.

## Security Best Practices

1. **Never commit secrets** to repository
2. **Rotate SSH keys** regularly
3. **Use separate Supabase projects** for UAT and Production
4. **Enable RLS (Row Level Security)** on Supabase tables
5. **Use HTTPS** only (enforced in nginx config)
6. **Review Supabase RLS policies** before production deployment
7. **Limit SSH access** to specific IPs if possible
8. **Monitor deployment logs** for suspicious activity

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review server logs: `sudo journalctl -u nginx -f`
3. Check Supabase logs in dashboard
4. Create an issue in the repository
