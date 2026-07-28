import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { Notification, NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  template:
    '@if (notification(); as current) { <div class="toast" [class.error]="current.type === \'error\'" role="status" aria-live="polite"><span class="toast-icon" aria-hidden="true">{{ current.type === \'error\' ? \'!\' : \'✓\' }}</span><span>{{ current.message }}</span></div> }',
  styleUrl: './toast.component.css',
})
export class ToastComponent implements OnDestroy {
  private readonly notifications = inject(NotificationService);
  private dismissTimer?: Subscription;
  readonly notification = signal<Notification | null>(null);
  private readonly subscription = this.notifications.notifications$.subscribe((notification) => {
    this.notification.set(notification);
    this.dismissTimer?.unsubscribe();
    this.dismissTimer = timer(3500).subscribe(() => this.notification.set(null));
  });
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.dismissTimer?.unsubscribe();
  }
}
