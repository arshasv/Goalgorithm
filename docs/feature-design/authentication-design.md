# Authentication UX Design

## Overview
Authentication in GOALGORITHM ensures secure, role-based access for Organizers and Team Leaders, providing clear feedback during the login process and maintaining session security.

## Screens
1. **Login Screen**: The primary entry point. Contains email and password fields, a "Remember Me" toggle, and a clear "Sign In" button.
2. **Logout Flow**: Accessible from the user profile dropdown in the top navigation, returning the user to the Login Screen.
3. **Password Reset (Future)**: Flow for users to recover lost credentials.

## States & Feedback
- **Loading**: Buttons display a loading spinner and disable further input during authentication requests.
- **Invalid Credentials**: Inline error messages explicitly state "Invalid email or password" without exposing which part was incorrect.
- **Expired Session**: Users are safely redirected to the Login Screen with a toast notification: "Your session has expired. Please log in again."
- **Permission Denied**: If a user attempts to access a restricted route, a 403 Forbidden UI page is shown with an option to return to the dashboard.

## Role Routing
- **Organizer**: Successfully authenticated Organizers are routed immediately to the `Organizer Dashboard`.
- **Team Leader**: Successfully authenticated Team Leaders are routed to the `Team Dashboard`.
