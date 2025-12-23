# 🔐 Vault - Secure File Storage Application

Complete project source code package

## 📦 What's Inside

This archive contains the complete source code for your Vault application:

### Source Code (src/)
- **Components** - React components for UI
  - `Auth.tsx` - Authentication interface
  - `VaultDashboard.tsx` - Main dashboard
  - `ContextMenu.tsx` - Right-click menu
  - `ShareLinkModal.tsx` - File sharing
  - `StorageAnalytics.tsx` - Usage analytics
  - `FileCommentsModal.tsx` - File comments

- **Contexts** - React context providers
  - `AuthContext.tsx` - Authentication state management

- **Libraries** - Utility functions
  - `supabase.ts` - Supabase client setup
  - `storage.ts` - File storage operations

### Database (supabase/migrations/)
- Complete database schema migrations
- Row Level Security (RLS) policies
- Storage bucket configuration
- File sharing and comments tables

### Configuration Files
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS setup
- `.env` - Environment variables

### Deployment Files
- `vps-install.sh` - Automated VPS installation
- `DEPLOY-NOW.md` - Quick deployment guide
- `DEPLOYMENT.md` - Detailed deployment instructions
- `nginx.conf` - Web server configuration

## 🚀 Getting Started

### 1. Extract the Archive

```bash
tar -xzf vault-project-complete.tar.gz
cd vault-project/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

The `.env` file is already configured with Supabase credentials.

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## 🌐 Deploy to Production

### Option 1: Quick VPS Deploy

```bash
# Build the project
npm run build

# Create deployment package
tar -czf deploy.tar.gz dist/

# Upload to your VPS
scp deploy.tar.gz root@178.128.28.19:/tmp/
scp vps-install.sh root@178.128.28.19:/tmp/

# Run installation
ssh root@178.128.28.19 'bash /tmp/vps-install.sh'
```

### Option 2: Manual Deploy

See `DEPLOY-NOW.md` for step-by-step instructions.

## 📋 Features

✅ User authentication (email/password)
✅ File upload and storage
✅ File organization (folders)
✅ File sharing with expiring links
✅ File comments and collaboration
✅ Storage analytics
✅ Favorite files
✅ Context menu actions
✅ Responsive design
✅ Secure with RLS policies

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Supabase
  - Authentication
  - PostgreSQL Database
  - File Storage
  - Realtime subscriptions
- **Icons**: Lucide React
- **Deployment**: Nginx on VPS

## 📁 Project Structure

```
vault-project/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # Context providers
│   ├── lib/            # Utilities & config
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # App entry point
│   └── index.css       # Global styles
├── supabase/
│   └── migrations/     # Database migrations
├── package.json        # Dependencies
├── vite.config.ts      # Build config
├── index.html          # HTML template
└── .env               # Environment variables
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Authenticated access only
- Secure file storage with access policies
- Protected API endpoints
- Input validation and sanitization

## 📝 Database Schema

### Tables
- `files` - File metadata and organization
- `file_shares` - Shareable links with expiration
- `file_comments` - Collaboration comments

### Storage
- `vault` - Secure file storage bucket

## 🆘 Troubleshooting

### Development Issues

**Port already in use:**
```bash
killall node
npm run dev
```

**Dependencies not installing:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build fails:**
```bash
npm run typecheck
```

### Deployment Issues

See `DEPLOYMENT.md` for detailed troubleshooting.

## 📄 License

This is your project - use it however you want!

## 🎯 Next Steps

1. Customize the design and branding
2. Add more file types support
3. Implement file preview
4. Add search functionality
5. Create mobile app version
6. Add team/workspace features

## 💡 Tips

- Keep your `.env` file secure
- Regularly backup your database
- Monitor Supabase usage limits
- Update dependencies regularly
- Enable HTTPS in production

---

**Ready to deploy?** Check `DEPLOY-NOW.md` for quick deployment instructions!

**Need help?** Review `DEPLOYMENT.md` for detailed documentation.
