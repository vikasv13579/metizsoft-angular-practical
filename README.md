# Secure Admin Portal

A standalone Angular 22 admin portal demonstrating authentication, protected routing, API-backed product management, and RxJS search.

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

Open `http://localhost:4200`.

Demo credentials: `Metizsoft@tech` / `Admin@123`.

## Structure

```
src/app/
  core/          models, auth/product services, guard, interceptor
  shared/        notification service and toast component
  features/auth/ lazy-loaded login feature
  features/dashboard/ lazy-loaded secured product dashboard
```

## Architecture

`AuthService` calls DummyJSON login and stores the JWT and minimal user profile in localStorage. `authGuard` blocks dashboard navigation when no token exists. `authInterceptor` attaches the bearer token to authenticated calls and clears the session after a 401 response.

The dashboard uses DummyJSON Products. Product mutations call the corresponding endpoint and refresh the list afterwards. Search uses a reactive form control with `debounceTime`, `distinctUntilChanged`, and `switchMap`, invoking DummyJSON's `/products/search` endpoint rather than filtering locally.
