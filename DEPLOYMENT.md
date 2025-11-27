# SpectraMovie - Production Deployment Guide

![SpectraMovie](https://img.shields.io/badge/Status-Production-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React](https://img.shields.io/badge/React-18+-blue)

**Live Site:** [https://spectramovie.site](https://spectramovie.site)

A premium movie streaming web application with advanced features including intelligent caching, mobile optimization, and real-time analytics.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [DigitalOcean Deployment](#digitalocean-deployment)
- [Domain Configuration](#domain-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Production Configuration](#production-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

- **Advanced Caching System**: Server-side caching with TTL support for handling thousands of concurrent users
- **Mobile Optimized**: Responsive design with gesture controls (double-tap seek)
- **Real-time Analytics**: Track user engagement and viewing patterns
- **Ad Integration**: Banner ads and ad-blocker detection
- **Smart Search**: Autocomplete suggestions with debouncing
- **Multi-Quality Streaming**: Adaptive quality selection with subtitles
- **My List**: Personal watchlist with local storage

---

## 🛠 Tech Stack

### Backend
- **Flask** - Python web framework
- **BeautifulSoup4** - Web scraping
- **Requests** - HTTP library with session management
- **SQLite** - Analytics database
- **Gunicorn** - Production WSGI server

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server

---

## 📦 Prerequisites

Before deploying, ensure you have:

- DigitalOcean account
- Domain name: `spectramovie.site` (already purchased)
- SSH key for server access
- Basic knowledge of Linux/Ubuntu commands

---

## 🚀 DigitalOcean Deployment

### Step 1: Create a Droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com)
2. Create a new Droplet:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month minimum recommended)
   - **CPU**: 1 vCPU, 1GB RAM (upgrade as needed)
   - **Datacenter**: Choose closest to your target audience
3. Add your SSH key
4. Create Droplet and note the IP address

### Step 2: Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_DROPLET_IP
```

Update system packages:

```bash
apt update && apt upgrade -y
```

Install required packages:

```bash
apt install -y python3 python3-pip python3-venv nginx git curl
```

Create a non-root user:

```bash
adduser spectra
usermod -aG sudo spectra
su - spectra
```

### Step 3: Clone and Setup Application

```bash
# Clone your repository (or upload files via SCP)
cd /home/spectra
git clone https://github.com/YOUR_USERNAME/spectramovie.git
cd spectramovie

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 4: Build Frontend

```bash
cd spectra-web

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install dependencies and build
npm install
npm run build
```

### Step 5: Create Requirements File

Create `requirements.txt` in project root:

```bash
cat > /home/spectra/spectramovie/requirements.txt << EOF
Flask==2.3.3
Flask-CORS==4.0.0
requests==2.31.0
beautifulsoup4==4.12.2
gunicorn==21.2.0
EOF
```

---

## 🌐 Domain Configuration

### Step 1: Point Domain to DigitalOcean

1. Go to your domain registrar (e.g., Namecheap, GoDaddy)
2. Update nameservers to DigitalOcean:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```

### Step 2: Add Domain in DigitalOcean

1. Go to DigitalOcean Dashboard → Networking → Domains
2. Add domain: `spectramovie.site`
3. Create DNS records:

| Type | Hostname | Value | TTL |
|------|----------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 3600 |
| A | www | YOUR_DROPLET_IP | 3600 |

---

## 🔐 SSL/HTTPS Setup

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/spectramovie
```

Paste this configuration:

```nginx
# Backend API server
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name spectramovie.site www.spectramovie.site;

    # Frontend - serve React build
    root /home/spectra/spectramovie/spectra-web/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend routing - serve index.html for all non-API routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Streaming optimizations
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/spectramovie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: Obtain SSL Certificate

```bash
sudo certbot --nginx -d spectramovie.site -d www.spectramovie.site
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

Certbot will automatically configure SSL and HTTPS redirects.

### Step 4: Auto-renewal

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## ⚙️ Production Configuration

### Step 1: Create Systemd Service

Create service file:

```bash
sudo nano /etc/systemd/system/spectramovie.service
```

Add configuration:

```ini
[Unit]
Description=SpectraMovie Flask Backend
After=network.target

[Service]
Type=notify
User=spectra
Group=spectra
WorkingDirectory=/home/spectra/spectramovie
Environment="PATH=/home/spectra/spectramovie/venv/bin"
ExecStart=/home/spectra/spectramovie/venv/bin/gunicorn --worker-class gevent --workers 4 --bind 127.0.0.1:5000 --timeout 120 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 2: Environment Variables

Create `.env` file (optional):

```bash
nano /home/spectra/spectramovie/.env
```

```env
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here
```

### Step 3: Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable spectramovie

# Start the service
sudo systemctl start spectramovie

# Check status
sudo systemctl status spectramovie
```

### Step 4: Update Frontend API Base URL

Update `spectra-web/src/services/api.ts`:

```typescript
const API_BASE = import.meta.env.PROD ? '/api' : '/api';
```

Rebuild frontend:

```bash
cd /home/spectra/spectramovie/spectra-web
npm run build
```

---

## 📊 Monitoring & Maintenance

### View Application Logs

```bash
# Backend logs
sudo journalctl -u spectramovie -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Cache Statistics

```bash
curl http://localhost:5000/api/cache/stats
```

### Analytics Database

View analytics:

```bash
cd /home/spectra/spectramovie
sqlite3 analytics.db
```

```sql
-- View total watches
SELECT COUNT(*) FROM watches;

-- View popular content
SELECT subject_id, title, COUNT(*) as watch_count 
FROM watches 
GROUP BY subject_id 
ORDER BY watch_count DESC 
LIMIT 10;

-- View daily active users
SELECT date, COUNT(DISTINCT session_id) as unique_users 
FROM watches 
GROUP BY date 
ORDER BY date DESC 
LIMIT 7;
```

### System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Check Nginx status
sudo systemctl status nginx

# Check app status
sudo systemctl status spectramovie
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart spectramovie

# Restart nginx
sudo systemctl restart nginx

# Clear cache
curl http://localhost:5000/api/cache/clear
```

---

## 🔄 Updating the Application

### Backend Updates

```bash
cd /home/spectra/spectramovie
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart spectramovie
```

### Frontend Updates

```bash
cd /home/spectra/spectramovie/spectra-web
git pull origin main
npm install
npm run build
sudo systemctl restart nginx
```

---

## 🐛 Troubleshooting

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Check if backend is running
sudo systemctl status spectramovie

# Check backend logs
sudo journalctl -u spectramovie -n 50

# Restart backend
sudo systemctl restart spectramovie
```

### Issue: SSL Certificate Error

**Solution:**
```bash
# Renew certificate
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

### Issue: High Memory Usage

**Solution:**
```bash
# Reduce Gunicorn workers in service file
sudo nano /etc/systemd/system/spectramovie.service
# Change: --workers 4 to --workers 2

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart spectramovie
```

### Issue: Cache filling up memory

**Solution:**
```bash
# Clear cache
curl http://localhost:5000/api/cache/clear

# Or restart app
sudo systemctl restart spectramovie
```

### Issue: Cannot connect to external API

**Solution:**
```bash
# Check session cookies
curl -v http://localhost:5000/api/home/trending

# Check server logs
sudo journalctl -u spectramovie -f
```

---

## 🔒 Security Best Practices

1. **Firewall Configuration:**
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

2. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Disable Root Login:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

4. **Monitor Failed Login Attempts:**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

---

## 📈 Performance Optimization

### Enable Nginx Caching

Add to Nginx configuration:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_bypass $http_cache_control;
    add_header X-Cache-Status $upstream_cache_status;
    # ... rest of config
}
```

### Database Optimization

```bash
# Vacuum analytics database periodically
sqlite3 analytics.db "VACUUM;"
```

---

## 📞 Support & Contact

- **Website:** https://spectramovie.site
- **Issues:** Check application logs first
- **Cache Stats:** https://spectramovie.site/api/cache/stats

---

## 📄 License

Proprietary - All rights reserved

---

## 🎉 Deployment Checklist

- [ ] DigitalOcean Droplet created
- [ ] Domain DNS pointed to droplet
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] Backend service running
- [ ] Frontend built and deployed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] SSL auto-renewal tested

---

**Deployment Date:** 2025-11-27  
**Version:** 1.0.0  
**Domain:** spectramovie.site
