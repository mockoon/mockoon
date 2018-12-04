import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subject } from 'rxjs/internal/Subject';

@Injectable()
export class AuthService {
  public userId: string = null;
  public authReady: Subject<void> = new Subject();

  constructor(public angularFireAuth: AngularFireAuth) { }

  /**
   * Auth anonymously on with firebase auth
   */
  public auth() {
    this.angularFireAuth.auth.signInAnonymously().then((credentials) => {
      if (credentials) {
        this.userId = credentials.user.uid;
      }

      this.authReady.next();
    });
  }
}
