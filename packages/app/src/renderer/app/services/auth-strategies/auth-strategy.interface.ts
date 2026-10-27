import { Observable } from 'rxjs';

export type AuthState = unknown | null;

export interface AuthStrategy {
  observeAuthState(): Observable<AuthState>;
  reloadUser(): Observable<unknown>;
  authWithToken(code: string): Observable<unknown>;
  getToken(force?: boolean): Observable<string | null>;
  startLoginFlow(): void;
  logout(): Observable<unknown>;
}
