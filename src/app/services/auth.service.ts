import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
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
        this.store.update({ type: 'SET_USER_ID', item: credentials.user.uid });
      }
    });
  }
}
