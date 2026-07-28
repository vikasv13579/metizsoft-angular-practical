import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { AuthUser, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'admin_portal_token';
const USER_KEY = 'admin_portal_user';
const AUTH_URL = 'https://dummyjson.com/auth/login';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly userSubject = new ReplaySubject<AuthUser | null>(1);
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    this.userSubject.next(this.readUser());
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(AUTH_URL, { username, password, expiresInMins: 60 })
      .pipe(tap((response) => this.persistSession(response)));
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
