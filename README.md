# Warranty & Repair Ticket Management System

A web-based CRUD application for managing customer warranty and repair service tickets. The project was prepared for the System Analysis and Design course requirements using a vanilla JavaScript single-page frontend, a Node.js/Express REST API, file-based database storage, Swagger API documentation, and unit-tested business logic.

## Features

- Register and login with JWT authentication
- Keep every user's ticket data isolated from other users
- Admin account can view and manage all users' tickets
- Admin users can manage user roles from the Users page
- Create, list, update and delete repair tickets
- Search tickets by customer name, product name or serial number
- Filter tickets by status and priority
- Admin users can filter tickets by owner
- Tickets use professional RMA numbers such as `RMA-2026-0001`
- Assign tickets to technicians
- Dashboard summary cards for ticket status overview
- Ticket detail modal with customer, product and service information
- Quick status update directly from the ticket list
- Status change notes and activity history for each ticket
- Automatically calculate warranty status from purchase date
- Validate inputs on both frontend and backend
- Interactive Swagger/OpenAPI documentation
- Unit tests for business logic functions

## Technology Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database: File-based JSON database layer
- API Documentation: Swagger UI
- Testing: Node.js built-in test runner


## Setup

1. Install Node.js.
2. Open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Start the application:

```bash
npm start
```

5. Open the app:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api-docs
```

The database file is created automatically under `data/repair_tickets.json`.

## Development

Run the server with automatic restart:

```bash
npm run dev
```

Run unit tests:

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register and receive JWT |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/health` | Check server health |
| GET | `/api/tickets` | List current user's tickets |
| GET | `/api/tickets/:id` | Get one current-user ticket |
| POST | `/api/tickets` | Create ticket for current user |
| PUT | `/api/tickets/:id` | Update current-user ticket |
| DELETE | `/api/tickets/:id` | Delete current-user ticket |
| GET | `/api/technicians` | List technicians |
| GET | `/api/users` | List users, admin only |
| PUT | `/api/users/:id/role` | Change user role, admin only |


## User Roles

Normal users can create, view, update and delete only their own repair tickets.

An admin account is created automatically when the application starts:

```text
Email: admin@example.com
Password: admin123
```

The admin can view and manage all tickets from all users. In the frontend, admin users can also see the owner of each ticket.

Admin users can open the Users page from the top navigation and promote normal users to admin or change admins back to normal users. A user cannot remove their own admin role.

### Query Parameters

`GET /api/tickets` supports:

- `search`: customer name, product name or serial number
- `status`: `Received`, `In Repair`, `Waiting Part`, `Completed`, `Delivered`
- `priority`: `Low`, `Medium`, `High`, `Urgent`
