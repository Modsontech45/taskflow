

// API Configuration
export const API_CONFIG = {
  // BASE_URL: 'https://taskflowbackend-0hbp.onrender.com/api',
  BASE_URL: 'https://taskflowbackend-omega.vercel.app/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Logging configuration
export const ENABLE_API_LOGGING = isDevelopment;

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_VERIFY_EMAIL: '/auth/verify-email',
  AUTH_REQUEST_PASSWORD_RESET: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

// Boards
BOARDS_ALL: '/boards/all',                          // GET all boards
BOARDS_CREATE: '/boards/create',                    // POST new board
BOARD_DETAIL: (boardId: string) => `/boards/${boardId}`, // GET, PATCH, DELETE
BOARD_TASKS: (boardId: string) => `/boards/${boardId}/tasks`,


  // Tasks
  TASK_DETAIL: (boardId: string, taskId: string) => `/boards/${boardId}/tasks/${taskId}`,
  TASK_TOGGLE: (boardId: string, taskId: string) => `/boards/${boardId}/tasks/${taskId}/toggle`,

  // Members (new endpoints under /members)
  MEMBERS: (boardId: string) => `/members/${boardId}`,            // GET all members, POST add member
  MEMBER_DETAIL: (boardId: string, userId: string) => `/members/${boardId}/${userId}`, // PUT update role, DELETE remove

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_READ: (notificationId: string) => `/notifications/${notificationId}/read`,

  // Subscriptions
  SUBSCRIPTIONS: (userId: string) => `/subscriptions/${userId}`,
  SUBSCRIPTIONS_CREATE: '/subscriptions',

  // Profile
  PROFILE: (userId: string) => `/profile/${userId}`,
} as const;





























// // API Configuration
// export const API_CONFIG = {
//   BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
//   TIMEOUT: 30000,
//   RETRY_ATTEMPTS: 3,
// } as const;

// // Environment detection
// export const isDevelopment = import.meta.env.DEV;
// export const isProduction = import.meta.env.PROD;

// // Logging configuration
// export const ENABLE_API_LOGGING = isDevelopment;

// // API endpoints
// export const API_ENDPOINTS = {
//   // Auth
//   AUTH_LOGIN: '/auth/login',
//   AUTH_REGISTER: '/auth/register',
//   AUTH_VERIFY_EMAIL: '/auth/verify-email',
//   AUTH_REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
//   AUTH_RESET_PASSWORD: '/auth/reset-password',

//   // Boards

//   // Tasks
//   TASK_DETAIL: (boardId: string, taskId: string) => `/boards/${boardId}/tasks/${taskId}`,
//   TASK_TOGGLE: (boardId: string, taskId: string) => `/boards/${boardId}/tasks/${taskId}/toggle`,
// } as const;
