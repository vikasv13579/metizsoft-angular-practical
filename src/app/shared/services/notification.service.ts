import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error';
}
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly subject = new Subject<Notification>();
  readonly notifications$ = this.subject.asObservable();
  success(message: string): void {
    this.subject.next({ message, type: 'success' });
  }
  error(message: string): void {
    this.subject.next({ message, type: 'error' });
  }
}
