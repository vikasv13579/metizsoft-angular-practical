# Secure Admin Portal

A standalone Angular 22 admin portal demonstrating authentication, protected routing, API-backed product management, and RxJS search.

## Live demo

[Open the deployed Secure Admin Portal](https://metizsoft-angular-practical.vercel.app/)

Demo credentials:

- Username: `Metizsoft@tech`
- Password: `Admin@123`

## Features

- Reactive-form login with validation, loading state, and feedback notifications
- DummyJSON authentication with persisted token and user session
- Functional auth guard and HTTP bearer-token interceptor with 401 handling
- Lazy-loaded login and dashboard routes
- Product list, create, edit, delete, refresh, and API-backed debounced search
- Responsive enterprise-style table with loading, empty, and error states

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200` and sign in with the demo credentials above.

## Structure

```
src/app/
  core/          models, auth/product services, guard, interceptor
  shared/        notification service and toast component
  features/auth/ lazy-loaded login feature
  features/dashboard/ lazy-loaded secured product dashboard
```

## Architecture

`AuthService` validates the local demo credentials and creates fresh opaque access and refresh tokens for every successful login. The access token and minimal user profile are stored in localStorage. `authGuard` blocks dashboard navigation when no token exists and redirects visitors to `/login?returnUrl=%2Fdashboard`. `authInterceptor` attaches the stored access token as a bearer token to authenticated calls and clears the session after a 401 response.

The dashboard uses DummyJSON Products. Product mutations call the corresponding endpoint and refresh the list afterwards. Search uses a reactive form control with `debounceTime`, `distinctUntilChanged`, and `switchMap`, invoking DummyJSON's `/products/search` endpoint rather than filtering locally.

## Visual requirement verification

The screenshots below are the recommended evidence for reviewing the live demo. Save the supplied screenshots in `screenshots/` using the shown file names, then commit them with the README.

| Requirement | Live test | Screenshot file |
| --- | --- | --- |
| Auth Guard | Open `/dashboard` while logged out. The app redirects to `/login?returnUrl=%2Fdashboard`. | `screenshots/01-auth-guard-login.png` |
| Reactive-form validation | Leave Password blank and submit. | `screenshots/02-password-required.png` |
| Login error toast | Submit incorrect credentials. | `screenshots/03-invalid-login-toast.png` |
| Successful authentication | Sign in using the demo credentials and verify the dashboard loads. | `screenshots/04-dashboard.png` |
| CRUD and search | Add, edit, delete, and search dashboard records. | `screenshots/05-crud-search.png` |
| Token interceptor | In DevTools Network, inspect an API request and verify its `Authorization: Bearer …` header. | `screenshots/06-authorization-header.png` |

> The supplied login screenshots demonstrate the first three rows: protected-route redirect, required password validation, and invalid-credential toast. Keep the browser address bar visible in the Auth Guard screenshot so the `returnUrl` is verifiable.
