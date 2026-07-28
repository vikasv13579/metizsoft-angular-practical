import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  readonly form = this.fb.nonNullable.group({
    username: ['Metizsoft@tech', Validators.required],
    password: ['Admin@123', [Validators.required, Validators.minLength(6)]],
  });
  readonly isSubmitting = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const { username, password } = this.form.getRawValue();
    this.auth
      .login(username, password)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.notifications.success('Signed in successfully.');
          void this.router.navigateByUrl(
            this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.notifications.error(this.getLoginErrorMessage(error));
        },
      });
  }

  private getLoginErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'object' && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    return error.status === 0
      ? 'Unable to reach the server. Please check your internet connection.'
      : 'Unable to sign in. Please check your username and password.';
  }
}
