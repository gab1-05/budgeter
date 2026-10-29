# CA2 - Expense Tracker Mini Project Report

## Overview
This is a MERN stack mini project implementing a personal expense tracker with authentication and CRUD operations for transactions.

## Technology Stack
- Frontend: React 19, Vite, React Router DOM
- Backend: Node.js, Express 5
- Database: MongoDB, Mongoose 9
- Auth: JWT, bcryptjs
- Other: CORS, dotenv

## Project Structure
CA2/
  client/ - React Vite frontend
  server/ - Express backend with models, routes, middleware

## Features Implemented
1. User Registration and Login with JWT
2. Protected Dashboard showing total income, expense and balance
3. Add new transaction with type, category, amount, description
4. View list of transactions
5. Delete transactions
6. Responsive UI with basic styling

## API Endpoints
POST /api/auth/register
POST /api/auth/login
GET /api/transactions
POST /api/transactions
PUT /api/transactions/:id
DELETE /api/transactions/:id

## Screenshots
[To be added after run]

## How to Run
Backend: cd server && npm install && node server.js
Frontend: cd client && npm install && npm run dev

## Conclusion
Successfully built a similar MERN application with different functionality from MyProfile project.
