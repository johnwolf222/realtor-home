# Stage 6 — Hidden Dashboard Icon + Owner Gate

This version removes the public Realtor/Owner Login experience.

## Access model

- Buyer login remains available at `/login`.
- Buyer registration remains available at `/register`.
- There is no public realtor login tab or owner-login button.
- The owner dashboard is accessed from a small dashboard icon on the public profile card.
- Opening the dashboard first asks for the private 8-character owner password.
- After the password is accepted, the owner must enter a dashboard notification email.
- The notification email is stored for future lead/tour/document/dashboard updates.

## Security tab

The dashboard Security tab now allows the owner to:

1. Change the private 8-character dashboard password.
2. Update the dashboard notification email.
3. Sign out and lock the dashboard session.

## Prototype note

This is still frontend mock security using localStorage/sessionStorage. For production, move the password, owner session, notification email, and dashboard authorization into Supabase Auth, database roles, Row Level Security, and server-side checks.
