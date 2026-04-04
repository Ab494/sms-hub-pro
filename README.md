# SMS Hub Pro

A comprehensive bulk SMS management platform built with modern web technologies. Send SMS messages, manage contacts and groups, track credits, and handle administrative tasks through an intuitive web interface.

## Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Bulk SMS Sending**: Send messages to individuals or groups
- **Contact Management**: Organize contacts into groups for targeted messaging
- **Credit System**: Track and manage SMS credits with payment integration
- **Admin Dashboard**: Manage users, transactions, and platform settings
- **Reports & Logs**: Monitor SMS delivery and campaign performance
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **ShadCN UI** components with Radix UI primitives
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Express Rate Limit** for API protection

### External Integrations
- **BlessedTexts API** for SMS delivery
- **M-Pesa** for payment processing

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- API keys for BlessedTexts and M-Pesa

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sms-hub-pro
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install

   # Backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sms-hub
   JWT_SECRET=your-jwt-secret
   BLESSEDTEXTS_API_KEY=your-api-key
   BLESSEDTEXTS_SENDER=your-sender-id
   MPESA_CONSUMER_KEY=your-consumer-key
   MPESA_CONSUMER_SECRET=your-consumer-secret
   ```

4. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev

   # Start frontend (from root directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest

### Backend
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server

## Project Structure

```
sms-hub-pro/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and API functions
│   └── assets/            # Static assets
├── backend/               # Backend source code
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── middleware/       # Express middleware
│   └── config/           # Configuration files
├── public/               # Public assets
└── dist/                 # Production build output
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/password` - Update password

### SMS Endpoints
- `POST /api/sms/send` - Send SMS
- `GET /api/sms/logs` - Get SMS logs

### Contact Management
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Group Management
- `GET /api/groups` - List groups
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `GET /api/admin/transactions` - List transactions
- `PUT /api/admin/settings` - Update platform settings

## Testing

Run tests with:
```bash
npm run test
```

## Deployment

### Quick Deploy

1. **Backend**: Use `render.yaml` for Render deployment
2. **Frontend**: Deploy to Vercel/Netlify
3. **Database**: MongoDB Atlas (free tier)

### Detailed Instructions

See `DEPLOYMENT.md` for comprehensive deployment guide including:

- Environment variable setup
- Database configuration
- Platform initialization
- Troubleshooting common issues

### Production Scripts

```bash
# Check deployment readiness
cd backend && npm run check

# Initialize platform settings
cd backend && npm run init your-admin@email.com

# Test SMS API
cd backend && npm run test-sms 0712345678
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.
