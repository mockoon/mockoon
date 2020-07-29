import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { setUserIdAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';
import { environment } from 'src/environments/environment';
import { v1 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private angularFireAuth: AngularFireAuth, private store: Store) {}

  /**
   * Auth anonymously with firebase auth
   */
  public auth() {
    if (environment.production) {
      this.angularFireAuth.auth.signInAnonymously().then((credentials) => {
        if (credentials) {
          this.store.update(setUserIdAction(credentials.user.uid));
        }
      });
    } else {
      this.store.update(setUserIdAction(uuid()));
    }
  }
}
