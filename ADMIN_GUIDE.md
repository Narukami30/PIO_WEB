# PIO Naujan — Admin & Account Setup Guide

A complete tutorial on creating an account, getting verified, understanding user roles, and using the admin dashboard.

🌐 **Live Site:** [https://pio-naujan.onrender.com](https://pio-naujan.onrender.com)

---

## Table of Contents

1. [Creating an Account](#1-creating-an-account)
2. [Logging In](#2-logging-in)
3. [Two-Factor Authentication (OTP Verification)](#3-two-factor-authentication-otp-verification)
4. [Getting Verified / Role Upgrade](#4-getting-verified--role-upgrade)
5. [Forgot Password](#5-forgot-password)
6. [Understanding Roles](#6-understanding-roles)
7. [Admin Dashboard Overview](#7-admin-dashboard-overview)
8. [Content Management](#8-content-management)
   - [Announcements](#81-announcements)
   - [Events](#82-events)
   - [Documents](#83-documents)
   - [Transparency Reports](#84-transparency-reports)
   - [Services (Citizen's Charter)](#85-services-citizens-charter)
9. [Emergency Management](#9-emergency-management)
   - [DRRM / Disaster Updates](#91-drrm--disaster-updates)
10. [Citizen Engagement](#10-citizen-engagement)
    - [Feedback](#101-feedback)
    - [Complaints](#102-complaints)
11. [Administration (Super Admin / ICT Officer Only)](#11-administration-super-admin--ict-officer-only)
    - [Departments](#111-departments)
    - [User Management](#112-user-management)
    - [Audit Logs](#113-audit-logs)
    - [Site Settings](#114-site-settings)
12. [Security Features](#12-security-features)
13. [FAQ](#13-faq)

---

## 1. Creating an Account

**URL:** [/auth/register](https://pio-naujan.onrender.com/auth/register)

### Step-by-Step

1. Go to the **Register** page
2. Fill in the required fields:
   - **First Name**
   - **Last Name**
   - **Email Address** — Must be a valid email (this will be used for login and OTP codes)
   - **Password** — Must be at least 8 characters and include:
     - At least one uppercase letter (A–Z)
     - At least one lowercase letter (a–z)
     - At least one number (0–9)
     - At least one special character (!@#$%^&* etc.)
   - **Confirm Password** — Must match the password above
3. Click **Create Account**
4. You'll see a success message: *"Registration successful! Please log in."*
5. You are redirected to the login page

> **Note:** All new accounts are registered with the **Public User** role by default. This role can only submit feedback, file complaints, and view public content. To access the admin dashboard, a Super Admin must upgrade your role (see [Getting Verified](#4-getting-verified--role-upgrade)).

---

## 2. Logging In

**URL:** [/auth/login](https://pio-naujan.onrender.com/auth/login)

### Step-by-Step

1. Go to the **Login** page
2. Enter your **Email Address** and **Password**
3. Click **Sign In**
4. What happens next depends on your role:
   - **Public User** — You are logged in immediately and redirected to the homepage
   - **Admin roles** (Super Admin, ICT Officer, Department Editor, Mayor's Office) — A **6-digit OTP code** is sent to your email. You'll be redirected to the OTP verification page (see [Section 3](#3-two-factor-authentication-otp-verification))

### Account Lockout
- After **5 failed login attempts**, your account is temporarily locked for **15 minutes**
- The lockout message tells you how many minutes remain
- After the lockout period, you can try again

---

## 3. Two-Factor Authentication (OTP Verification)

All admin-level accounts require two-factor authentication (2FA) for security.

### How It Works

1. After entering correct login credentials, a **6-digit verification code** is sent to your registered email
2. You are redirected to the **Verify Login** page
3. Enter the 6-digit code from your email
4. Click **Verify**
5. If correct, you are logged in and redirected to the admin dashboard

### Important Notes
- The OTP code **expires after 10 minutes** — if it expires, log in again to get a new code
- You have **5 attempts** to enter the correct code — after 5 failures, you must log in again
- Check your **spam/junk folder** if you don't see the email
- The OTP is sent from the PIO system email (the sender may vary depending on configuration)

---

## 4. Getting Verified / Role Upgrade

When you register, your account has the **Public User** role with limited access. To get an admin role and access the dashboard:

### How to Get Verified

1. **Register an account** at [/auth/register](https://pio-naujan.onrender.com/auth/register)
2. **Contact the Super Admin** (the PIO head or system administrator) and request a role upgrade
   - Provide your registered **email address**
   - Specify what access you need (content management, department editing, etc.)
3. The **Super Admin** will:
   - Go to **Admin Dashboard → Users**
   - Find your account
   - Click **Edit**
   - Change your role from "Public User" to the appropriate role
   - Assign your department (if applicable)
   - Save
4. Once your role is upgraded, **log out and log back in** for the changes to take effect
5. You will now be asked for OTP verification on login and have access to the admin dashboard

### Alternative: Admin Creates Your Account

The Super Admin or ICT Officer can also create accounts directly with pre-assigned roles:

1. They go to **Admin Dashboard → Users → New User**
2. They fill in your name, email, password, role, and department
3. They provide you with your login credentials
4. You log in and change your password if needed

---

## 5. Forgot Password

**URL:** [/auth/forgot-password](https://pio-naujan.onrender.com/auth/forgot-password)

If you forget your password:

1. Go to the **Login** page and click **"Forgot Password?"**
2. Enter your registered **email address**
3. Click **Send Reset Link**
4. Check your email for a password reset link
5. Click the link and set a new password (same requirements as registration)
6. Log in with your new password

---

## 6. Understanding Roles

The system has **5 roles**, each with different levels of access:

### Role Hierarchy

| Role | Display Name | Access Level | Description |
|------|-------------|--------------|-------------|
| `super_admin` | **Super Admin** | Full Access | Complete control over everything — users, content, settings, audit logs. Only **one** Super Admin can exist. |
| `ict_officer` | **ICT Officer** | High Access | Same as Super Admin except cannot manage roles. Has access to departments, users, audit logs, and site settings. |
| `department_editor` | **Department Editor** | Medium Access | Can manage announcements, events, documents, and services. Typically assigned to specific department staff. |
| `mayors_office` | **Mayor's Office** | Medium Access | Can manage announcements, events, transparency reports, feedback, and complaints. Designed for the Mayor's office staff. |
| `public_user` | **Public User** | Basic Access | Can only submit feedback, file complaints, and view public content. **Default role for all new registrations.** |

### Detailed Permission Matrix

| Permission | Super Admin | ICT Officer | Dept. Editor | Mayor's Office | Public User |
|------------|:-----------:|:-----------:|:------------:|:--------------:|:-----------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Announcements | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Events | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Documents | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Transparency | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Services | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Disaster Updates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Feedback | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Complaints | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Departments | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Site Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Content | ✅ | ✅ | ✅ | ✅ | ❌ |
| Submit Feedback | ✅ | ❌ | ❌ | ❌ | ✅ |
| Submit Complaint | ✅ | ❌ | ❌ | ❌ | ✅ |

> **Super Admin bypass:** The Super Admin automatically passes all permission checks, regardless of the specific permission listed.

---

## 7. Admin Dashboard Overview

**URL:** [/admin/dashboard](https://pio-naujan.onrender.com/admin/dashboard)

The dashboard is the central hub after logging in as an admin user.

### What You See

#### Primary Stats (Top Row)
Four main stats cards showing:
- **Announcements** — Total number of announcements
- **Documents** — Total uploaded documents
- **Pending Complaints** — Complaints awaiting review or action
- **New Feedback** — Unread feedback submissions

#### Secondary Stats
- **Events** — Total events
- **Services** — Total municipal services listed
- **Departments** — Total active departments
- **Active Alerts** — Currently active disaster/emergency alerts

#### Quick Actions Panel
Shortcut buttons to quickly create new content:
- New Announcement
- New Event
- Upload Document
- New Service

#### Recent Activity
- **Recent Feedback** — Last 5 feedback submissions
- **Recent Complaints** — Last 5 complaints filed
- **Audit Log** — Last 10 system actions (logins, edits, deletions)

### Sidebar Navigation

The left sidebar provides access to all admin sections:

**Content Management:**
- Dashboard
- Announcements
- Events
- Documents
- Transparency
- Services

**Emergency:**
- DRRM Updates

**Citizen Engagement:**
- Feedback
- Complaints

**Administration** *(Super Admin & ICT Officer only):*
- Departments
- Users
- Audit Logs
- Site Settings

**Other:**
- View Website (opens the public-facing site in a new tab)

---

## 8. Content Management

### 8.1 Announcements

**URL:** [/admin/announcements](https://pio-naujan.onrender.com/admin/announcements)

#### Creating an Announcement
1. Click **Announcements** in the sidebar
2. Click **New Announcement** (or the + button)
3. Fill in:
   - **Title** — The headline of the announcement
   - **Category** — Select: Notice, Advisory, Ordinance, Resolution, Job Posting, etc.
   - **Content** — The full body text of the announcement
   - **Department** — Which department is issuing it (optional)
   - **Featured Image** — Upload a photo or graphic (stored on Cloudinary)
   - **Published** — Toggle on to make it visible to the public
   - **Pinned** — Toggle on to keep it at the top of the announcements list
4. Click **Save**

#### Managing Announcements
- View all announcements in a table
- **Edit** — Click the edit button to modify any announcement
- **Delete** — Remove an announcement permanently
- **Publish/Unpublish** — Toggle visibility without deleting

---

### 8.2 Events

**URL:** [/admin/events](https://pio-naujan.onrender.com/admin/events)

#### Creating an Event
1. Click **Events** in the sidebar
2. Click **New Event**
3. Fill in:
   - **Title** — Event name
   - **Description** — Full details
   - **Start Date & Time** — When the event begins
   - **End Date & Time** — When it ends (optional)
   - **Location** — Where it takes place
   - **Department** — Organizing department
   - **Featured Image** — Event poster or photo
   - **Published** — Toggle on to make visible
4. Click **Save**

---

### 8.3 Documents

**URL:** [/admin/documents](https://pio-naujan.onrender.com/admin/documents)

#### Uploading a Document
1. Click **Documents** in the sidebar
2. Click **Upload Document**
3. Fill in:
   - **Title** — Document name
   - **Category** — Ordinance, Executive Order, Resolution, Form, etc.
   - **Department** — Issuing department
   - **File** — Upload the document file (PDF, DOC, etc.) — stored on Cloudinary
   - **Description** — Brief summary (optional)
   - **Published** — Toggle on to make downloadable by the public
4. Click **Save**

---

### 8.4 Transparency Reports

**URL:** [/admin/transparency](https://pio-naujan.onrender.com/admin/transparency)

#### Publishing a Transparency Report
1. Click **Transparency** in the sidebar
2. Click **New Report**
3. Fill in:
   - **Title** — Report name
   - **Report Type** — Annual Budget, Financial Report, Procurement, etc.
   - **Fiscal Year** — The year the report covers
   - **File** — Upload the report document
   - **Description** — Summary (optional)
   - **Published** — Toggle on to make visible
4. Click **Save**

---

### 8.5 Services (Citizen's Charter)

**URL:** [/admin/services](https://pio-naujan.onrender.com/admin/services)

#### Adding a Service
1. Click **Services** in the sidebar
2. Click **New Service**
3. Fill in:
   - **Service Name** — What the service is called
   - **Description** — What the service provides
   - **Department** — Which office handles it
   - **Requirements** — List of documents or prerequisite needed
   - **Steps** — Step-by-step procedure to avail the service
   - **Processing Time** — How long it takes
   - **Fees** — Any applicable charges
   - **Active** — Toggle on to display publicly
4. Click **Save**

---

## 9. Emergency Management

### 9.1 DRRM / Disaster Updates

**URL:** [/admin/disaster](https://pio-naujan.onrender.com/admin/disaster)

#### Posting a Disaster Alert
1. Click **DRRM Updates** in the sidebar
2. Click **New Update**
3. Fill in:
   - **Title** — Alert headline (e.g., "Typhoon Signal #2 — Naujan")
   - **Alert Level** — Select severity:
     - **Information** — General updates
     - **Advisory** — Be alert
     - **Warning** — Take precautions
     - **Critical** — Immediate action needed
   - **Description** — Full details and instructions
   - **Affected Areas** — Barangays or locations affected
   - **Active** — Toggle on for currently active alerts (shown on the homepage)
   - **Published** — Toggle on to make visible
4. Click **Save**

#### Deactivating an Alert
When a disaster situation is resolved:
1. Go to the alert in the list
2. Click **Edit**
3. Toggle **Active** off
4. Save — The alert will no longer appear on the homepage but remains in the archive

---

## 10. Citizen Engagement

### 10.1 Feedback

**URL:** [/admin/feedback](https://pio-naujan.onrender.com/admin/feedback)

#### Reviewing Feedback
1. Click **Feedback** in the sidebar
2. View the list of all citizen feedback (sorted newest first)
3. Each entry shows:
   - Citizen name, email, category
   - Subject and date
   - Status (New, Reviewed, Responded)
4. Click **View** to read the full message
5. Update the status as you process it

---

### 10.2 Complaints

**URL:** [/admin/complaints](https://pio-naujan.onrender.com/admin/complaints)

#### Managing Complaints
1. Click **Complaints** in the sidebar
2. View all complaints with their:
   - Tracking code
   - Citizen name
   - Category
   - Status
   - Date filed
3. Click **View** to see full complaint details
4. **Update status** — Change from:
   - **Submitted** → **Under Review** → **In Progress** → **Resolved** or **Closed**
5. **Add updates** — Post internal notes or responses visible when the citizen tracks their complaint
6. Assign to the appropriate department if not already assigned

---

## 11. Administration (Super Admin / ICT Officer Only)

These sections are only visible to **Super Admin** and **ICT Officer** roles.

### 11.1 Departments

**URL:** [/admin/departments](https://pio-naujan.onrender.com/admin/departments)

#### Managing Departments
1. Click **Departments** in the sidebar
2. View all 17+ municipal departments
3. **Edit** a department to update:
   - Department name and code
   - Department head name and title
   - Contact information
   - Description and functions
   - Photo/logo
   - Active status and display order
4. **Create** new departments if needed

---

### 11.2 User Management

**URL:** [/admin/users](https://pio-naujan.onrender.com/admin/users)

#### Viewing Users
1. Click **Users** in the sidebar
2. See all registered users with their:
   - Name and email
   - Role
   - Department
   - Active status
   - Registration date

#### Creating a New User
1. Click **New User**
2. Fill in: First Name, Last Name, Email, Password
3. **Select a Role** — Choose from the available roles
4. **Assign Department** — If they are a department editor
5. **Active** — Toggle on to allow login
6. Click **Save**

#### Editing a User
1. Find the user in the list
2. Click **Edit**
3. Modify their role, department, active status, or other details
4. Click **Save**

#### Upgrading a User's Role (Verification)
1. Find the user who registered with "Public User" role
2. Click **Edit**
3. Change the **Role** dropdown to the appropriate admin role
4. Assign a **Department** if needed
5. Toggle **Active** on
6. Click **Save**
7. Inform the user to log out and log back in

> **Important:** There can only be **one Super Admin** account. The system prevents creating a second one.

---

### 11.3 Audit Logs

**URL:** [/admin/audit-logs](https://pio-naujan.onrender.com/admin/audit-logs)

The audit log tracks all significant actions in the system for accountability.

#### What Gets Logged
- User logins and logouts
- Content creation, editing, and deletion (announcements, events, documents, etc.)
- User account changes (creation, role changes)
- Complaint and feedback status updates

#### Each Log Entry Shows
- **Timestamp** — When the action occurred
- **User** — Who performed the action
- **Action** — What was done (create, update, delete, login, logout)
- **Resource** — What was affected (Announcement, User, Complaint, etc.)
- **Details** — Specifics of the action
- **IP Address** — Where the request came from

#### Managing Logs
- **Pagination** — Browse through logs (50 per page)
- **Delete Single Entry** — Remove a specific log (Super Admin only)
- **Clear All Logs** — Wipe all audit history (Super Admin only — use with caution)

---

### 11.4 Site Settings

**URL:** [/admin/settings](https://pio-naujan.onrender.com/admin/settings)

Configure global website settings:

- **Hero Section** — Update the homepage banner text, images, and logo
- **About Section** — Edit the About PIO content, mission, vision, and mandate
- **Partner Agencies** — Add, edit, or remove partner agency logos and links
- **Contact Information** — Update office address, phone, email displayed on the site
- **Social Media Links** — Update Facebook, YouTube, and other social links

---

## 12. Security Features

The system includes several security measures to protect admin accounts:

| Feature | Details |
|---------|---------|
| **Two-Factor Authentication** | All admin logins require an email OTP code |
| **Password Requirements** | Minimum 8 characters with uppercase, lowercase, number, and special character |
| **Account Lockout** | 5 failed login attempts = 15-minute lockout |
| **OTP Expiry** | Verification codes expire after 10 minutes |
| **OTP Attempt Limit** | 5 failed OTP attempts = session invalidated |
| **JWT Authentication** | Secure httpOnly cookies with access tokens (8h) and refresh tokens (7d) |
| **CSRF Protection** | Origin/referer validation on all state-changing requests |
| **Rate Limiting** | Auth routes: 15 attempts per 15 minutes; Public forms: 10 per 15 minutes |
| **Audit Logging** | All admin actions are logged with user, IP, and timestamp |
| **Helmet + CSP** | HTTP security headers and Content Security Policy with nonces |

---

## 13. FAQ

**Q: I registered but can't access the admin dashboard. Why?**
A: New accounts get the "Public User" role by default, which has no dashboard access. Contact the Super Admin to upgrade your role.

**Q: I didn't receive the OTP email. What should I do?**
A: Check your spam/junk folder. If still not received, wait a moment and try logging in again to trigger a new OTP. If the problem persists, contact the system administrator.

**Q: Can there be more than one Super Admin?**
A: No. The system enforces a single Super Admin. If a second Super Admin is needed, the current one must be demoted first.

**Q: I logged in but don't see some sidebar options. Is something broken?**
A: No — sidebar sections are shown based on your role. Only Super Admins and ICT Officers see the Administration section (Departments, Users, Audit Logs, Site Settings). See the [permission matrix](#detailed-permission-matrix) for details.

**Q: How do I deactivate a user without deleting them?**
A: Go to Users → Edit the user → Toggle "Active" off → Save. They won't be able to log in, but their account and history are preserved.

**Q: How do I change my own password?**
A: Use the "Forgot Password" link on the login page to reset your password via email.

**Q: Where are uploaded files stored?**
A: All uploaded images and documents are stored on **Cloudinary** (cloud storage). They are not stored on the web server itself, so they persist across deployments.

**Q: How do I take the site offline temporarily?**
A: The site doesn't have a maintenance mode built in. Contact the system administrator to pause the Render service if needed.

---

*Public Information Office — Municipality of Naujan, Oriental Mindoro*
*Created by Mark Gabriel G. Baje | BSIT — Mindoro State University, Calapan Campus*
