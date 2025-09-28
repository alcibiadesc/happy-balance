# 💰 Happy Balance - Personal Finance Tracker

<div align="center">

![Status](https://img.shields.io/badge/Status-Experimental-orange)
![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-orange)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

**⚠️ EXPERIMENTAL PROJECT - NOT PRODUCTION READY ⚠️**

*A minimalist, privacy-focused personal finance management application*

[Features](#-features) • [Screenshots](#-screenshots) • [Quick Start](#-quick-start) • [Docker](#-docker) • [Development](#-development) • [License](#-license)

</div>

---

## 🎯 Overview

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
- 📁 **CSV Import** - Import transactions from your bank
- 🔄 **Real-time Updates** - Instant UI updates
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 🚀 **High Performance** - Built with SvelteKit and TypeScript

## 📸 Screenshots

<div align="center">
<i>Screenshots coming soon...</i>
</div>

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and pnpm
- PostgreSQL 15+
- Or just Docker 🐳

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/alcibiadesc/expense-tracker.git
cd expense-tracker

# Run the setup wizard
./docker-init.sh

# Or manually with docker-compose
cp .env.docker .env
docker-compose up -d
```

Access the application at `http://localhost:5173`

### Option 2: Manual Installation

```bash
# Clone the repository
git clone https://github.com/alcibiadesc/expense-tracker.git
cd expense-tracker

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend
pnpm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start development servers
pnpm dev # Frontend on :5173
cd backend && pnpm dev # Backend on :3004
```

### Default Credentials
- Username: `admin`
- Password: `admin123`

**⚠️ CHANGE THESE IMMEDIATELY IN PRODUCTION!**

## 🐳 Docker Deployment

### Using Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_PASSWORD: change_me
      POSTGRES_DB: happy_balance

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:change_me@postgres:5432/happy_balance
      JWT_ACCESS_SECRET: change_me_32_chars_minimum
    ports:
      - "3004:3004"

  frontend:
    build: .
    environment:
      VITE_API_URL: http://localhost:3004/api
    ports:
      - "5173:5173"
```

### Using Portainer

1. Create a new stack in Portainer
2. Use the repository URL: `https://github.com/alcibiadesc/expense-tracker.git`
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
expense-tracker/
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

Found a security issue? Please email security@[domain] (coming soon) or open an issue.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Budget planning features
- [ ] Recurring transactions
- [ ] Financial goals tracking
- [ ] Export to PDF reports
- [ ] Plaid/Bank API integration
- [ ] Cryptocurrency tracking
- [ ] Investment portfolio tracking

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Icons by [Lucide](https://lucide.dev/)
- Inspired by minimalist design principles

## 📞 Support

- 📧 Email: (coming soon)
- 🐛 [Issue Tracker](https://github.com/alcibiadesc/expense-tracker/issues)
- 💬 [Discussions](https://github.com/alcibiadesc/expense-tracker/discussions)

## ⚠️ Disclaimer

This is an **experimental project** under active development. It may contain bugs and is not recommended for production use without thorough testing. Use at your own risk.

---

<div align="center">

**Made with ❤️ for the open-source community**

[⬆ Back to top](#-happy-balance---personal-finance-tracker)

</div>