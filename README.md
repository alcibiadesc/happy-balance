# 💰 Happy Balance - Personal Finance Tracker

<div align="center">

<img src="./static/logo/happy-balance-logo-with-text.png" alt="Happy Balance Logo" width="300">

![Status](https://img.shields.io/badge/Status-Experimental-orange)
![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-orange)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Docker Hub](https://img.shields.io/docker/pulls/alcibiadesc/happy-balance)

**🔒 The Private, Self-Hosted Alternative to Fintonic, Mint & YNAB**

_Take control of your financial data. No cloud, no tracking, no compromises._

**⚠️ EXPERIMENTAL PROJECT - NOT PRODUCTION READY ⚠️**

**🎮 [Try the live demo →](https://alci.es/tools)** — interactive preview with placeholder data, no install needed.

[Demo](https://alci.es/tools) • [Features](#-features) • [Screenshots](#-screenshots) • [Quick Start](#-quick-start) • [Docker](#-docker) • [Development](#-development) • [License](#-license)

</div>

---

## 🎯 Why Happy Balance?

Unlike Fintonic, Mint, or other cloud-based finance apps that monetize your data, Happy Balance runs entirely on your own infrastructure. Your financial data never leaves your control.

### 📊 Compare with Popular Apps

| Feature | Happy Balance | Fintonic | Mint | YNAB |
|---------|--------------|----------|------|------|
| 🔒 Self-Hosted | ✅ | ❌ | ❌ | ❌ |
| 🕵️ Zero Tracking | ✅ | ❌ | ❌ | ❌ |
| 💰 Free Forever | ✅ | Freemium | Ads | Paid |
| 🌐 Open Source | ✅ | ❌ | ❌ | ❌ |
| 🏠 Data Ownership | 100% Yours | Their Servers | Their Servers | Their Servers |
| 🚫 No Ads | ✅ | ❌ | ❌ | ✅ |

Happy Balance is an open-source personal finance tracker designed with simplicity and privacy in mind. Track expenses, manage budgets, and gain insights into your financial habits without compromising your data privacy.

### 🌟 Key Principles

- **Privacy First**: Your data stays yours - self-hosted solution
- **Minimalist Design**: Clean, distraction-free interface
- **No Tracking**: Zero telemetry, zero external analytics
- **Open Source**: Transparent, auditable, and community-driven

## ✨ Features

### Core Functionality

- 📊 **Expense Tracking** - Categorize and track all your expenses
- 📈 **Visual Analytics** - Beautiful charts and insights
- 🏷️ **Smart Categorization** - AI-powered transaction categorization
- 💱 **Multi-Currency** - Support for multiple currencies
- 🌐 **Multi-Language** - English and Spanish support
- 🌙 **Dark Mode** - Eye-friendly dark theme
- 📱 **Responsive** - Works on desktop, tablet, and mobile

### Technical Features

- 🔐 **JWT Authentication** - Secure user sessions
- 👥 **Multi-User Support** - Role-based access control (Admin, User, Viewer)
- 📁 **CSV Import** - Import transactions from your bank (N26 compatible)
- 🔄 **Real-time Updates** - Instant UI updates
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 🚀 **High Performance** - Built with SvelteKit and TypeScript

### 🏦 Bank Import Compatibility

Happy Balance currently supports CSV import from:

- **N26** - Full support for N26 CSV export format
- **Generic CSV** - Customizable import for other banks

Want support for your bank? [Create an issue](https://github.com/alcibiadesc/happy-balance/issues) with a sample CSV format (with dummy data) and we'll implement it!

## 📸 Screenshots

<div align="center">

### 💰 Dashboard Overview
Track your income, expenses, and financial health at a glance

![Dashboard](./static/screenshots/dashboard.png)

### 📊 Transaction Management
Categorize and track every expense with powerful filtering

![Transactions](./static/screenshots/transactions.png)

### 🏷️ Smart Categories
Organize your expenses with customizable categories

![Categories](./static/screenshots/categories.png)

### 📱 Mobile Responsive
Manage your finances on the go

<img src="./static/screenshots/mobile-dashboard.png" alt="Mobile View" width="375">

### ⚙️ User Settings
Customize your experience with comprehensive settings

![Settings](./static/screenshots/settings.png)

</div>

## 🚀 Quick Start

### Option 1: Docker (Easiest) 🐳

```bash
# Clone the repo
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance

# Start everything with one command
docker-compose up -d
```

Access at: `http://localhost:5173`
- Username: `admin`
- Password: `admin123`

That's it! 🎉 Everything is automatically configured.

### Option 2: Development Setup

```bash
# Clone the repository
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance

# Install dependencies
pnpm install
cd backend && pnpm install

# Setup database
npx prisma migrate dev

# Start development
pnpm dev # Frontend on :5173
cd backend && pnpm dev # Backend on :3004

  frontend:
    build: .
    environment:
      VITE_API_URL: http://localhost:3004/api
    ports:
      - "5173:5173"
```

### Using Portainer

1. Create a new stack in Portainer
2. Use the repository URL: `https://github.com/alcibiadesc/happy-balance.git`
3. Set the compose path to `docker-compose.yml`
4. Configure environment variables
5. Deploy the stack

[Full Docker documentation →](./DOCKER_INSTALL.md)

## 🛠️ Development

### Tech Stack

**Frontend:**

- SvelteKit 2.0
- TypeScript 5.0
- Vite
- TailwindCSS (via custom CSS variables)

**Backend:**

- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication

### Project Structure

```
happy-balance/
├── src/                    # Frontend (SvelteKit)
│   ├── lib/               # Components and utilities
│   ├── routes/            # SvelteKit routes
│   └── app.html           # HTML template
├── backend/               # Backend API
│   ├── src/
│   │   ├── domain/        # Business logic
│   │   ├── infrastructure/# Database, external services
│   │   └── application/   # Use cases
│   └── prisma/            # Database schema
├── docker-compose.yml     # Docker configuration
└── package.json           # Frontend dependencies
```

### Development Commands

```bash
# Frontend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm lint             # Run linter
pnpm format           # Format code

# Backend
cd backend
pnpm dev              # Start dev server
pnpm build            # Build TypeScript
pnpm start            # Start production server
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
```

### Environment Variables

Create a `.env` file in the root:

```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/happy_balance
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-min-32-chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password

# Frontend
VITE_API_URL=http://localhost:3004/api
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 📄 License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

### What this means:

- ✅ You can use this software for personal and commercial purposes
- ✅ You can modify and distribute the software
- ⚠️ Any modifications must be released under GPLv3
- ⚠️ If you distribute this software, you must provide the source code
- 💼 For commercial licensing options, please contact us

## 🔒 Security

- **No telemetry or tracking**
- **All data stored locally or on your server**
- **Encrypted passwords (bcrypt)**
- **JWT tokens for authentication**
- **CORS protection**
- **SQL injection prevention (Prisma ORM)**

Found a security issue? Please open a security issue on GitHub.

## 🗺️ Roadmap

- [ ] Enhanced transaction categorization
- [ ] Advanced reporting and insights
- [ ] Data export in multiple formats
- [ ] Multi-workspace support
- [ ] Advanced budgeting rules

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Icons by [Lucide](https://lucide.dev/)
- Inspired by minimalist design principles

## 📞 Support

- 🐛 [Issue Tracker](https://github.com/alcibiadesc/happy-balance/issues)
- 💬 [Discussions](https://github.com/alcibiadesc/happy-balance/discussions)

## ⚠️ Disclaimer

This is an **experimental project** under active development. It may contain bugs and is not recommended for production use without thorough testing. Use at your own risk.

---

<div align="center">

**Made for the open-source community**

[⬆ Back to top](#-happy-balance---personal-finance-tracker)

</div>
