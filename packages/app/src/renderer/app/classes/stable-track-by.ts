export class StableTrackBy<T extends object> {
  private trackIds = new WeakMap<T, number>();
  private nextTrackId = 0;

  public id(item: T) {
    let trackId = this.trackIds.get(item);

    if (trackId === undefined) {
      trackId = this.nextTrackId++;
      this.trackIds.set(item, trackId);
    }

    return trackId;
  }
}
