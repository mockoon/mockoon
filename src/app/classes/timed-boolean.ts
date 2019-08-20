import { BehaviorSubject } from 'rxjs';

/**
 * Boolean flag that invert itself upon read, and revert to its initial state after a certain duration.
 * Useful for delete buttons switching to confirmation after the first click and reverting to initial state after a duration.
 */
export class TimedBoolean extends BehaviorSubject<boolean> {

  constructor(private initialState = false, private duration = 4000) {
    super(initialState);

    this.subscribe(state => {
      if (state !== this.initialState) {
        setTimeout(() => {
          this.next(!state);
        }, this.duration);
      }
    });
  }

  /**
   * Read the current value and immediately invert
   */
  public readValue() {
    try {
      return this.getValue();
    } finally {
      this.next(!this.value);
    }
  }
}
