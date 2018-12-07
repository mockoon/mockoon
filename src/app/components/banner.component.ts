import { Component, DoCheck, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { shell } from 'electron';
import { Subscription } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { SettingsService } from 'src/app/services/settings.service';
import { BannerConfigType } from 'src/app/types/misc.type';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-banner',
  templateUrl: 'banner.component.html'
})
export class BannerComponent implements OnInit, DoCheck {
  public bannerData: BannerConfigType;
  private bannerConfigSubscription: Subscription;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private settingsService: SettingsService
  ) { }

  ngOnInit() { }

  ngDoCheck() {
    // wait for settings and auth to be ready to load banner config
    if (this.authService.userId && this.settingsService.settings && !this.bannerConfigSubscription) {
      this.bannerConfigSubscription = this.firestore.collection(environment.remoteConfigCollection).doc('banner').valueChanges().pipe(
        take(1),
        filter((bannerData: BannerConfigType) => bannerData.enabled && !this.settingsService.settings.bannerDismissed.includes(bannerData.id)),
        tap((bannerData: BannerConfigType) => {
          this.bannerData = bannerData;
        })
      ).subscribe();
    }
  }

  /**
   * Open banner link
   */
  public openLink() {
    shell.openExternal(this.bannerData.link);
  }

  /**
   * Dismiss banner and save it to the settings
   */
  public dismissBanner() {
    this.bannerData.enabled = false;

    this.settingsService.settings.bannerDismissed = [...this.settingsService.settings.bannerDismissed, this.bannerData.id];
    this.settingsService.settingsUpdateEvents.next(this.settingsService.settings);
  }
}
