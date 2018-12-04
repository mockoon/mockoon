import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { shell } from 'electron';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { BannerType } from 'src/app/types/misc.type';

@Component({
  selector: 'app-banner',
  templateUrl: 'banner.component.html'
})
export class BannerComponent implements OnInit {
  public bannerData: BannerType;

  constructor(private firestore: AngularFirestore, private authService: AuthService) { }

  ngOnInit() {
    // retrieve banner config object in database
    this.authService.authReady.subscribe(() => {
      this.firestore.collection('config').doc('banner').valueChanges().pipe(take(1)).subscribe((bannerData: BannerType) => {
        this.bannerData = bannerData;
      });
    });
  }

  /**
   * Open banner link
   */
  public openLink() {
    shell.openExternal(this.bannerData.link);
  }
}
