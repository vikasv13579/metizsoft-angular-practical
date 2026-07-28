import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, ReplaySubject, delay, of, throwError } from 'rxjs';
import { AuthUser, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'admin_portal_token';
const USER_KEY = 'admin_portal_user';
const DEMO_USERNAME = 'Metizsoft@tech';
const DEMO_PASSWORD = 'Admin@123';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly userSubject = new ReplaySubject<AuthUser | null>(1);
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    this.userSubject.next(this.readUser());
  }

  login(username: string, password: string): Observable<LoginResponse> {
    if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: { message: 'Invalid username or password.' },
          }),
      );
    }

    const response: LoginResponse = {
      id: 1,
      username: DEMO_USERNAME,
      firstName: 'Metizsoft',
      lastName: 'Admin',
      email: 'admin@metizsoft.com',
      accessToken: 'local-demo-access-token',
      refreshToken: 'local-demo-refresh-token',
    };
    this.persistSession(response);
    return of(response).pipe(delay(350));
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.userSubject.next(null);
  }

  get token(): string | null {
    return this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null;
  }
  get isAuthenticated(): boolean {
    return !!this.token;
  }

  private persistSession(response: LoginResponse): void {
    const user: AuthUser = {
      id: response.id,
      username: response.username,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      image: response.image,
    };
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    this.userSubject.next(user);
  }

  private readUser(): AuthUser | null {
    if (!this.isBrowser) return null;
    const storedUser = localStorage.getItem(USER_KEY);
    try {
      return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
