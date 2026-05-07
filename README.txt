WorkOS - AI-Assisted Team Task Manager
======================================

Developer: Ashwani Baghel
Live Demo: https://workos-production-0d1c.up.railway.app/
Repository: https://github.com/ashwanibaghel/WorkOS.git


Demo Admin Access
-----------------

Use this account for project review/demo only.

Live App: https://workos-production-0d1c.up.railway.app/
Role: Admin
Email: demo.admin@workos.com
Password: Demo@12345

Note: This is a public demo account created only so reviewers can access the admin dashboard,
assign roles, create projects, and test the complete WorkOS flow. Reviewers can also click
the "Use Demo Admin" button on the login screen for one-click access.


1. Project Overview
-------------------

WorkOS is a full-stack AI-assisted team task management system built for real team workflows.
It allows teams to create projects, manage members, assign tasks, track progress, review work,
communicate through project chat, and use AI for productivity support.

This project is not a simple CRUD application. It focuses on production-style architecture,
role-based access control, real-time collaboration, clean backend separation, and practical AI usage.


2. Tech Stack
-------------

Frontend:
- React
- Vite
- React Router
- Axios
- Socket.IO Client
- @hello-pangea/dnd for drag-and-drop Kanban board
- Lucide React icons
- Google OAuth client integration

Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt password hashing
- Zod input validation
- Socket.IO
- Helmet and rate limiting

AI:
- OpenRouter API
- OpenAI-compatible SDK

Deployment:
- Railway
- MongoDB Atlas


3. Main Features
----------------

Authentication:
- Email and password signup/login
- Google OAuth login
- JWT-based protected APIs
- Password hashing using bcrypt
- Strong password validation on signup
- First registered user becomes Admin
- New users are created as Members by default

Role-Based Access Control:
- Admin: full system access
- Manager: project and team execution access
- Member: assigned task execution access

Project Management:
- Create, update, delete projects
- Add project details like category, priority, status, delivery mode, goals, success criteria, dates, and tags
- Add or remove project members
- Assign project manager
- Mark project as completed

Task Management:
- Create, update, delete tasks
- Assign tasks to members
- Set due dates
- Track status using Todo, In Progress, Review, and Done
- Member can submit task for review
- Manager reviews and marks task as Done

Team Collaboration:
- Project-level team chat
- Messages show sender name and timestamp
- Project members and managers can discuss work inside the project

Notifications:
- Task assignment notification
- Task review request notification
- Task approval notification
- Status update notification

Activity Log:
- Tracks important project and task actions
- Useful for audit history and project visibility

Dashboard:
- Separate role-based dashboard experience
- Admin gets system-level insights
- Manager gets project execution and review workflow
- Member gets focused assigned-task view

AI Features:
- Task breakdown from natural language
- Smart task description generator
- Project suggestions
- Project summary
- Role/context-aware AI assistant
- AI-assisted task review support


4. Role Permissions
-------------------

Admin:
- Can view all projects and users
- Can create and manage projects
- Can assign project managers
- Can update user roles
- Can manage teams and tasks

Manager:
- Can create projects
- Can manage members inside accessible projects
- Can assign tasks only to Member users
- Can review submitted tasks
- Can mark reviewed tasks as Done
- Cannot assign another Manager/Admin as a normal team member

Member:
- Can view assigned/access projects
- Can update only assigned task status
- Can move task to In Progress
- Can submit task for Review
- Cannot directly mark task as Done
- Cannot create/delete projects or tasks


5. Task Workflow
----------------

1. Manager creates a project.
2. Manager adds members to the project.
3. Manager creates tasks and assigns them to members.
4. Member starts the task by moving it to In Progress.
5. After completing the work, Member submits the task for Review.
6. Manager receives notification and reviews the task.
7. If the work is correct, Manager marks the task as Done.

This workflow is closer to a real company process because task completion requires review and approval.


6. Backend Architecture
-----------------------

The backend follows a layered architecture:

Routes -> Controllers -> Services -> Models

Routes:
- Define API endpoints
- Attach authentication, authorization, and validation middleware

Controllers:
- Handle request and response
- Keep HTTP logic separate from business logic

Services:
- Contain business rules
- Handle project, task, AI, notification, activity, and auth logic

Models:
- Mongoose schemas for MongoDB collections

Middleware:
- Authentication middleware
- RBAC authorization middleware
- Validation middleware
- Error handling middleware
- Rate limiting and security middleware


7. Database Collections
-----------------------

User:
- name
- email
- password
- role
- authProvider
- googleId
- avatar
- email verification fields

Project:
- name
- description
- category
- priority
- status
- deliveryMode
- projectManager
- startDate
- dueDate
- goals
- successCriteria
- tags
- createdBy
- members

Task:
- title
- description
- projectId
- assignedTo
- status
- dueDate
- reviewRequestedAt
- reviewedAt
- reviewedBy
- completedAt

Notification:
- userId
- projectId
- taskId
- type
- message
- read

ActivityLog:
- action
- entityType
- entityId
- userId
- projectId
- metadata

ProjectMessage:
- projectId
- sender
- message


8. API Overview
---------------

Authentication:
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/google
- GET /api/auth/me
- GET /api/auth/verify-email/:token
- POST /api/auth/resend-verification

Projects:
- GET /api/projects
- POST /api/projects
- GET /api/projects/:projectId
- PATCH /api/projects/:projectId
- DELETE /api/projects/:projectId
- POST /api/projects/:projectId/members/:memberId
- DELETE /api/projects/:projectId/members/:memberId
- GET /api/projects/:projectId/activity
- GET /api/projects/:projectId/messages
- POST /api/projects/:projectId/messages

Tasks:
- GET /api/tasks/project/:projectId
- POST /api/tasks
- PATCH /api/tasks/:taskId
- DELETE /api/tasks/:taskId

AI:
- POST /api/ai/breakdown
- POST /api/ai/description
- GET /api/ai/projects/:projectId/suggestions
- GET /api/ai/projects/:projectId/summary
- POST /api/ai/projects/:projectId/chat
- POST /api/ai/dashboard/chat
- POST /api/ai/tasks/:taskId/review


9. Environment Variables
------------------------

Backend environment variables:

MONGO_URI=MongoDB Atlas connection string
JWT_SECRET=JWT secret key
JWT_EXPIRES_IN=JWT expiry duration
CLIENT_URL=Frontend/live app URL
GOOGLE_CLIENT_ID=Google OAuth client ID
OPENROUTER_API_KEY=OpenRouter API key
OPENROUTER_MODEL=OpenRouter model name
OPENROUTER_REFERER=Application URL for OpenRouter
OPENROUTER_TITLE=WorkOS
NODE_ENV=production or development

Optional email variables:

SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=

Frontend environment variables:

VITE_GOOGLE_CLIENT_ID=Google OAuth client ID
VITE_API_URL=Optional API URL for development
VITE_SOCKET_URL=Optional Socket.IO URL for development

In production, the frontend is served by the backend and uses same-origin /api calls.


10. Local Setup
---------------

Step 1: Clone the repository

git clone https://github.com/ashwanibaghel/WorkOS.git
cd WorkOS

Step 2: Install root dependencies

npm install

Step 3: Install frontend and backend dependencies

npm run install:all

Step 4: Create backend/.env

Add required variables like MONGO_URI, JWT_SECRET, CLIENT_URL, GOOGLE_CLIENT_ID, and OPENROUTER_API_KEY.

Step 5: Run development server

npm run dev

Frontend runs on:
http://localhost:5173

Backend runs on:
http://localhost:5000


11. Production Build and Deployment
-----------------------------------

Build command:

npm run install:all && npm run build

Start command:

npm start

Railway configuration:
- Builder: Nixpacks
- Healthcheck path: /health
- Backend serves frontend build in production
- MongoDB Atlas is connected through MONGO_URI
- Secrets are stored as Railway environment variables


12. Why This Project Is Strong
------------------------------

- Clean full-stack architecture
- Real role-based access control
- Practical task review workflow
- Real-time updates using Socket.IO
- AI used only for intelligent assistance
- MongoDB schema relationships
- Production deployment on Railway
- Secure password hashing and JWT authentication
- Separate responsibilities for Admin, Manager, and Member
- Project chat, notifications, activity logs, dashboards, and analytics-ready structure


13. Short Demo Explanation
--------------------------

WorkOS is an AI-assisted team task manager. Admin manages the system, Manager creates projects
and assigns tasks, and Members work on assigned tasks. Members submit completed work for review,
and Managers approve it. The project also includes team chat, notifications, activity logs,
real-time updates, and an AI assistant for task breakdown, descriptions, suggestions, and summaries.

The backend is built with Node.js, Express, MongoDB, Mongoose, JWT, RBAC middleware, Socket.IO,
and OpenRouter AI integration. The frontend is built with React and Vite. The complete project
is deployed on Railway.
