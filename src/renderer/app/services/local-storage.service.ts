import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private storageKeys = '';

  constructor() {}

  /**
   * set an item in the localStorage
   *
   * @param key
   * @param value
   */
  public setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  /**
   * get an item from the localStorage
   *
   * @param key
   * @returns
   */
  public getItem(key: string) {
    return localStorage.getItem(key);
  }

  /**
   * remove an item from the localStorage
   *
   * @param key
   */
  public removeItem(key: string) {
    localStorage.removeItem(key);
  }
}
