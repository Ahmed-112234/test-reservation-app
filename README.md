# Test Reservation System

## Project Overview
This project is a web application that allows teachers to reserve test dates using a shared calendar.  
The goal of the system is to prevent overlapping tests that can cause stress for students and scheduling conflicts for teachers.

Teachers can view existing reservations, select available dates, and book their own tests.  
The system automatically prevents conflicts when tests with the same credit value are scheduled on the same day.

For Grade 11 and 12, High School and IB tests are allowed to occur on the same day.

---

# Prerequisites

Before running the application, make sure the following software is installed:

- **Node.js** (version 18 or newer recommended)  
  https://nodejs.org

- **npm** (installed automatically with Node.js)

- **Git** (optional but recommended for version control)  
  https://git-scm.com

- A modern web browser such as:
  - Google Chrome
  - Microsoft Edge
  - Firefox

---

# Project Structure


test-reservation-app
│
├── server → Backend (Node.js + Express + SQLite)
│
├── client → Frontend (React + Vite + FullCalendar)
│
└── README.md


---

# Installation

Clone the repository:


git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git


Navigate into the project folder:


cd test-reservation-app


---

# Install Dependencies

### Backend


cd server
npm install


### Frontend

Open another terminal and run:


cd client
npm install


---

# Running the Application

The application requires **two terminals**.

### Start the backend server


cd server
npm run dev


The server will start at:


http://localhost:4000


---

### Start the frontend

Open another terminal:


cd client
npm run dev


The frontend will run at:


http://localhost:5173


Open that link in your browser.

---

# Demo Accounts

You can log in using the following sample teachers:


FatimaMansoori / Pass1234!
JohnGillooley / Word!4321

---

# How to Use the System

### 1. Login
Teachers log in using their username and password.

### 2. View the Calendar
The calendar displays all reserved tests.

Each reservation shows:
- Subject
- Grade
- Credits
- Teacher

### 3. Reserve a Test
1. Click a date on the calendar
2. Fill in the reservation form
3. Click **Reserve**

Rules enforced by the system:

- Tests can only be booked **7–14 days in advance**
- Two tests with the **same credit value cannot occur on the same day**
- **Grade 11 and 12** can share the same day **only if one is IB and the other is High School**

### 4. View Reservation Details
Click a reservation on the calendar to open a details modal.

### 5. Edit Reservation
Teachers can edit their own reservations using the **edit icon**.

### 6. Delete Reservation
Teachers can delete their own reservations using the **delete icon**.

A confirmation prompt will appear before deletion.

---

# Technologies Used

Frontend:
- React
- Vite
- FullCalendar
- CSS

Backend:
- Node.js
- Express.js
- SQLite
- Zod (validation)
- JWT authentication

---

# Key Features

- Shared calendar for all teachers
- Automatic conflict detection
- Grade validation (1–12)
- Special handling for Grade 11/12 IB vs High School
- Reservation editing and deletion
- Authentication system
- Responsive modern UI

---

# Educational Purpose

This project was developed as a **Grade 12 Computer Science project** to demonstrate:

- Web application development
- Using Version Control
- Frontend and backend integration
- Database management
- Input validation
- User authentication
- Real-world problem solving

The system addresses the real issue of **test scheduling conflicts in schools**.

---
