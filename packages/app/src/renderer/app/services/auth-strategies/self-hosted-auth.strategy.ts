import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, take, tap, throwError } from 'rxjs';
import {
  AuthState,
  AuthStrategy
} from 'src/renderer/app/services/auth-strategies/auth-strategy.interface';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class SelfHostedAuthStrategy implements AuthStrategy {
  private uiService = inject(UIService);
  private mainApiService = inject(MainApiService);
  private settingsService = inject(SettingsService);

  private authState$ = new BehaviorSubject<AuthState>(null);
  private token: string | null = null;

  public observeAuthState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  public reloadUser() {
    if (this.token) {
      this.authState$.next({ authenticated: true });
    }

    return of(null);
  }

  public authWithToken(token: string) {
    const normalizedToken = token?.trim();

    if (!normalizedToken) {
      return throwError(() => new Error('INVALID_TOKEN'));
    }

    this.token = normalizedToken;
    this.authState$.next({ authenticated: true });

    return of(null);
  }

  public getToken() {
    return of(this.token);
  }

  public startLoginFlow() {
    this.uiService.openModal('auth');

    if (Config.isWeb) {
      return;
    }

    this.settingsService
      .selectApiURL()
      .pipe(
        take(1),
        tap((apiURL) => {
          this.mainApiService.send('APP_AUTH', `${apiURL}login`);
        })
      )
      .subscribe();
  }

  public logout() {
    this.token = null;
    this.authState$.next(null);

    return of(null);
  }
}
