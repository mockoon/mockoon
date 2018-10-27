import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { Subject } from 'rxjs/internal/Subject';

@Injectable()
export class AuthService {
  public userId = null;
  public authReady: Subject<boolean> = new Subject();

  constructor() {
    const config = {
      apiKey: 'AIzaSyCIkzTtimLebXjf-gfCQ6iwCVFsYRhCRvs',
      authDomain: 'mockoon-ba3e2.firebaseapp.com',
      databaseURL: 'https://mockoon-ba3e2.firebaseio.com',
      projectId: 'mockoon-ba3e2',
      storageBucket: 'mockoon-ba3e2.appspot.com',
      messagingSenderId: '902702764744'
    };

    firebase.initializeApp(config);

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid;
      }
      this.authReady.next(true);
    });
  }

  public auth() {
    firebase.auth().signInAnonymously().catch((error) => {
      console.log(error);
    });
  }
}
