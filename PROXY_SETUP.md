# Proxy Setup Guide for SpectraMovie

This guide explains how to configure a proxy to bypass IP blocking from streaming providers.

## Why You Need a Proxy

The streaming API (lok-lok.cc) blocks requests from DigitalOcean and other cloud provider IPs. A proxy routes your requests through a different IP address to bypass this restriction.

## Quick Setup

### Step 1: Choose a Proxy Service

#### Option A: Free Proxies (Not Recommended for Production)
- **Pros:** Free
- **Cons:** Unreliable, slow, may stop working anytime
- **Sources:** 
  - https://www.proxy-list.download/
  - https://free-proxy-list.net/

#### Option B: WebShare (Recommended - Best Balance)
- **Cost:** $2.99/month for 10 proxies
- **Speed:** Fast
- **Reliability:** High
- **Sign up:** https://www.webshare.io/

#### Option C: ScraperAPI (Premium)
- **Cost:** $49/month
- **Pros:** Handles all proxy rotation automatically
- **Sign up:** https://www.scraperapi.com/

### Step 2: Configure the Proxy

Once you have a proxy URL, add it to your service file:

1. Edit the systemd service file:
   ```bash
   sudo nano /etc/systemd/system/spectramovie.service
   ```

2. Add the proxy URL to the `Environment` section:
   ```ini
   [Service]
   Environment="PATH=/home/spectra/spectra/venv/bin"
   Environment="STREAMING_PROXY_URL=http://username:password@proxy-server:port"
   ```

   **Example with WebShare:**
   ```ini
   Environment="STREAMING_PROXY_URL=http://youruser:yourpass@p.webshare.io:80"
   ```

   **Example with free proxy:**
   ```ini
   Environment="STREAMING_PROXY_URL=http://123.45.67.89:8080"
   ```

3. Reload and restart:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart spectramovie
   ```

### Step 3: Verify

Check the logs to confirm the proxy is being used:
```bash
sudo journalctl -u spectramovie -n 20
```

You should see: `[+] Using proxy: http://...`

## Testing Proxy Manually

Test if your proxy works before configuring:

```bash
curl -x http://username:password@proxy:port https://api.ipify.org
```

This should return the proxy's IP address, not your server's IP.

## Troubleshooting

**Proxy not working?**
- Check proxy credentials (username/password)
- Verify proxy is active (some free proxies go offline)
- Try a different proxy from your list

**Still getting 403 errors?**
- The proxy IP might also be blocked
- Try switching to a residential proxy (more expensive but harder to block)
- Consider ScraperAPI which handles IP rotation automatically

## Recommended Solution

For a production app, I recommend **WebShare.io**:
1. Sign up at https://www.webshare.io/
2. Get 10 proxies for $2.99/month
3. Use rotating proxies to avoid blocks
4. They provide a simple proxy URL format

## Alternative: Cloudflare Workers (Advanced)

Instead of a traditional proxy, you can use Cloudflare Workers to make the API requests:
- Cloudflare IPs are less likely to be blocked
- Free tier: 100,000 requests/day
- Requires code changes to use Worker API

Let me know if you want help setting this up!
