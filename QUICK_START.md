# 🚀 Happy Balance - Quick Start Guide

## ⚡ Zero-Configuration Install (Recommended)

Just run this single command - **no configuration needed!**

```bash
curl -sSL https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/docker-compose.yml | docker compose -f - up -d
```

The app **automatically detects** your server's URL from your browser.

**Access from:**
- **Same computer:** http://localhost:3000
- **Other devices:** http://YOUR_SERVER_IP:3000 (e.g., http://192.168.1.50:3000)

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change these credentials after first login!

---

## 🔑 Default Credentials

- **Username:** admin
- **Password:** admin123

## 📍 How It Works

Happy Balance uses **smart URL detection**:

1. **Server-Side Rendering (SSR):** Uses internal Docker network (`http://backend:3004`)
2. **Browser (Client):** Auto-detects from `window.location` (works on any IP/hostname!)

This means:
- ✅ Works on localhost
- ✅ Works on your NAS (Synology, QNAP, etc.)
- ✅ Works on any IP address
- ✅ No configuration files needed!

---

## 🛠️ Troubleshooting

### Check if containers are running:
```bash
docker ps
```

You should see 3 containers:
- `happy-balance-frontend`
- `happy-balance-backend`
- `happy-balance-postgres`

### View logs:
```bash
docker logs happy-balance-frontend
docker logs happy-balance-backend
docker logs happy-balance-postgres
```

### Stop and remove everything:
```bash
docker compose down -v
```

### Update to latest version:
```bash
docker compose pull
docker compose up -d
```

---

## 🔒 Security Notes

For production use, make sure to:

1. **Change JWT secrets** to random 32+ character strings
2. **Change admin credentials**
3. **Use HTTPS** with proper certificates
4. **Configure firewall** rules appropriately
5. **Set specific CORS origin** instead of wildcard

Create a `.env` file for production:

```env
JWT_ACCESS_SECRET=your-random-32-char-secret-here
JWT_REFRESH_SECRET=another-random-32-char-secret
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD=YourSecurePassword123!
CORS_ORIGIN=https://yourdomain.com
```

---

## 📚 More Information

- [Full Documentation](https://github.com/alcibiadesc/happy-balance)
- [Docker Hub](https://hub.docker.com/r/alcibiadesc/happy-balance)
- [Report Issues](https://github.com/alcibiadesc/happy-balance/issues)