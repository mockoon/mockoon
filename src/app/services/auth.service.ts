import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { setUserIdAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';

@Injectable()
export class AuthService {
  constructor(private angularFireAuth: AngularFireAuth, private store: Store) { }

  /**
   * Auth anonymously with firebase auth
   */
  public auth() {
    this.angularFireAuth.auth.signInAnonymously().then((credentials) => {
      if (credentials) {
        this.store.update(setUserIdAction(credentials.user.uid));
      }
    });
  }
}
