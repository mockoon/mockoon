import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { shell } from 'electron';
import { filter, take } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { SettingsService } from 'src/app/services/settings.service';
import { BannerType } from 'src/app/types/misc.type';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-banner',
  templateUrl: 'banner.component.html'
})
export class BannerComponent implements OnInit {
  public bannerData: BannerType;

  constructor(private firestore: AngularFirestore, private authService: AuthService, private settingsService: SettingsService) { }

  ngOnInit() {
    // retrieve banner config object in database (TODO refactor to chain observables)
    this.authService.authReady.subscribe(() => {
      this.settingsService.settingsReady.subscribe(() => {
        this.firestore.collection(environment.remoteConfigCollection).doc('banner').valueChanges().pipe(
          take(1),
          filter((bannerData: BannerType) => bannerData.enabled && !this.settingsService.settings.bannerDismissed.includes(bannerData.id))
        ).subscribe((bannerData: BannerType) => {
          this.bannerData = bannerData;
        });
      });
    });
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
