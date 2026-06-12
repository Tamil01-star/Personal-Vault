Project Name: Secure Personal Vault

Create a modern, secure, and user-friendly web application called "Secure Personal Vault". The website acts as a personal digital vault where users can securely store passwords, usernames, notes, diary entries, letters, and other important personal information.

Core Requirements:

1. User Authentication

* Sign Up with:

  * Username
  * Mobile Number
  * Password
* Login using:

  * Username + Password
  * Mobile Number + Password
* Forgot Password:

  * OTP verification through registered mobile number
  * Allow password reset after successful OTP verification
* Secure session management

2. Dashboard

* Clean, modern, professional UI
* Light and Dark Theme toggle
* Responsive design for mobile, tablet, and desktop
* Sidebar navigation
* Search functionality
* User profile section

3. Password Manager Module
   This is the most important and unique section of the website.

Features:

* Store Website/App Name
* Username
* Password
* Category
* Notes
* Created Date
* Updated Date

Password Features:

* Show/Hide Password button
* Copy Password button
* Strong Password Generator
* Password Strength Indicator
* Search passwords
* Filter passwords by category
* Edit password records
* Delete password records with confirmation popup
* Secure card-based layout
* Unique premium interface design

4. Notes Module
   Users can create and manage notes.

Features:

* Create Note
* Edit Note
* Delete Note
* Confirmation before deletion
* Rich text editor
* Auto-save draft option
* Search notes
* Date created and modified

5. Diary Module
   Features:

* Create daily diary entries
* Calendar view
* Edit entries
* Delete entries with confirmation
* Search diary entries
* Organized by date

6. Letters Module
   Features:

* Create personal letters
* Save drafts
* Edit letters
* Delete letters with confirmation
* Rich text formatting
* Search letters

7. Important Documents/Files Module
   Features:

* Upload files
* Upload images
* Upload PDFs
* Upload text documents
* Preview files
* Download files
* Rename files
* Delete files with confirmation

8. CRUD Operations
   For all modules:

* Create
* Read
* Update
* Delete

Every delete action must:

* Show confirmation dialog
* Require user confirmation
* Permanently remove data from database after confirmation

9. Database Requirements
   Store all user data in database:

* User Accounts
* Password Records
* Notes
* Diary Entries
* Letters
* Uploaded Files

When a user deletes any item, it must also be deleted from the database permanently.

10. Security Requirements

* Password hashing using bcrypt
* JWT authentication
* Input validation
* Secure API endpoints
* Data encryption for stored passwords
* Rate limiting for login attempts
* CSRF protection
* XSS protection

11. Technology Stack
    Frontend:

* Next.js
* React
* TypeScript
* Tailwind CSS
* ShadCN UI

Backend:

* Node.js
* Express.js

Database:

* PostgreSQL

Authentication:

* JWT
* OTP verification via mobile number

File Storage:

* Cloudinary or AWS S3

12. UI Design Requirements

* Creative and elegant design
* Professional dashboard
* Minimal animations
* Premium card layouts
* Modern icons
* Beautiful typography
* Dark and Light themes
* Smooth user experience
* Highly organized sections

13. Additional Features

* Global search
* User settings page
* Change password
* Account management
* Data statistics dashboard
* Recent activity section
* Backup and restore support

Goal:
Build a complete secure personal vault application where users can safely manage passwords, usernames, personal notes, diary entries, letters, and uploaded files in separate organized sections with a premium modern interface and strong security.
