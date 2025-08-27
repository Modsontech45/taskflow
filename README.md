# Task Management Platform

A modern, responsive task management platform built with React, TypeScript, and Tailwind CSS. This frontend application integrates seamlessly with a Node.js + Express + PostgreSQL backend API.

## Features

### 🔐 Authentication
- User registration with email verification
- Secure login with JWT tokens
- Password reset functionality
- Protected routes and automatic token management

### 📋 Task Management
- Create, edit, and delete tasks
- Task completion tracking
- Time-based task scheduling (start/end dates)
- Rich task descriptions with notes

### 🏢 Board Collaboration
- Create and manage multiple boards
- Collaborative board sharing
- Role-based permissions (Owner, Editor, Viewer)
- Member management with invite system

### 📊 Dashboard
- Overview of all boards and tasks
- Upcoming tasks widget
- Activity statistics
- Quick access to recent boards

### 🎨 Modern UI/UX
- Fully responsive design (mobile-first)
- Clean, professional interface
- Smooth animations and transitions
- Accessibility-compliant design
- Dark mode support (optional)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Routing**: React Router v6
- **State Management**: React Context + useReducer
- **HTTP Client**: Fetch API with custom ApiClient
- **Date Handling**: date-fns
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (Node.js + Express + PostgreSQL)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd task-management-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your API URL:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Environment Configuration

The application uses environment variables for configuration:

- `VITE_API_URL`: Backend API base URL (default: http://localhost:5000/api)
- `VITE_NODE_ENV`: Environment mode (development/production)

## API Integration

The frontend integrates with the following backend endpoints:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Email verification
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password

### Boards
- `GET /boards` - List user's boards
- `POST /boards` - Create new board
- `GET /boards/:id` - Get board details
- `PUT /boards/:id` - Update board
- `DELETE /boards/:id` - Delete board

### Board Members
- `POST /boards/:id/members` - Add member
- `PUT /boards/:id/members/:userId` - Update member role
- `DELETE /boards/:id/members/:userId` - Remove member

### Tasks
- `GET /boards/:id/tasks` - Get board tasks
- `POST /boards/:id/tasks` - Create task
- `GET /tasks/:id` - Get task details
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── board/          # Board management components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components (Navbar, etc.)
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── services/           # API services
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── App.tsx             # Main application component
```

## Key Components

### Authentication Flow
- `LoginForm` - User login with validation
- `RegisterForm` - User registration with email verification
- `EmailVerification` - Email verification handler
- `ForgotPassword` - Password reset request
- `ResetPassword` - Password reset with token
- `ProtectedRoute` - Route protection wrapper

### Board Management
- `BoardList` - Display all user boards
- `BoardDetail` - Individual board view with tasks
- `BoardMemberManagement` - Manage board members and roles

### Task Management
- Task creation and editing modals
- Task completion tracking
- Task filtering and sorting

### UI Components
- `Button` - Customizable button component
- `Input` - Form input with validation
- `Modal` - Reusable modal component
- `Card` - Content card component
- `Toast` - Notification system

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (recommended)

### API Logging

In development mode, all API requests and responses are logged to the console for debugging purposes.

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Environment Variables for Production

Set the following environment variables in your production environment:

```env
VITE_API_URL=https://your-api-domain.com/api
```

### Deployment Platforms

The application can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.# taskflow
