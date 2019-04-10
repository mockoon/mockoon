import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { shell } from 'electron';
import { combineLatest } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';
import { Store } from 'src/app/stores/store';
import { BannerConfigType } from 'src/app/types/misc.type';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-banner',
  templateUrl: 'banner.component.html'
})
export class BannerComponent implements OnInit {
  public bannerData: BannerConfigType;

  constructor(
    private firestore: AngularFirestore,
    private settingsService: SettingsService,
    private store: Store
  ) { }

  ngOnInit() {
    combineLatest(
      this.store.select('userId'),
      this.store.select('settings')
    ).pipe(
      filter(result => !!result[0] && !!result[1])
    ).subscribe((r) => {
      this.firestore.collection(environment.remoteConfigCollection).doc('banner').valueChanges().pipe(
        take(1),
        filter((bannerData: BannerConfigType) => bannerData.enabled && !this.store.get('settings').bannerDismissed.includes(bannerData.id)),
        tap((bannerData: BannerConfigType) => {
          this.bannerData = bannerData;
        })
      ).subscribe();
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

    this.settingsService.updateSettings({ bannerDismissed: [...this.store.get('settings').bannerDismissed, this.bannerData.id] });
  }
}
