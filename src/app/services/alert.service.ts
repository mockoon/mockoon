import { Injectable } from '@angular/core';
import * as uuid from 'uuid/v1';

export type AlertTypes = 'error' | 'success' | 'warning';
export type Alert = { id: string, message: string, type: AlertTypes };

@Injectable()
export class AlertService {
  public alerts: Alert[] = [ ];

  constructor() { }

  /**
   * Display an alert
   * @param type - type of alert
   * @param message - text message to display
   */
  public showAlert(type: AlertTypes, message: string) {
    const newAlert = {
      id: uuid(),
      type,
      message
    };

    this.alerts.push(newAlert);

    // schedule automatic alert deletion
    setTimeout(() => {
      this.removeAlert(newAlert.id);
    }, 5000);
  }

  public removeAlert(alertId: string) {
    const alertIndex = this.alerts.findIndex((alert: Alert) => {
      return alert.id === alertId;
    });

    if (alertIndex > -1) {
      this.alerts.splice(alertIndex, 1);
    }
  }
}
