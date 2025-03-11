import { BehaviorSubject } from 'rxjs';

/**
 * Boolean flag that invert itself upon read, and revert to its initial state after a certain duration.
 * Useful for delete buttons switching to confirmation after the first click and reverting to initial state after a duration.
 * Payload can be used where more instance are needed to be activated alternatively (list index)
 */

export class TimedBoolean extends BehaviorSubject<{
  enabled: boolean;
  payload?: any;
}> {
  private timeout;

  constructor(private duration = 4000) {
    super({ enabled: false, payload: null });
  }

  /**
   * Read the current value and immediately invert the state
   */
  public readValue(payload?: any) {
    const currentValue = this.getValue();

    try {
      return currentValue;
    } finally {
      // if payload present and toggle requested for a different payload, force true
      const nextValue = {
        enabled:
          !!payload && payload !== currentValue.payload
            ? true
            : !currentValue.enabled,
        payload
      };

      this.next(nextValue);

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      if (nextValue.enabled) {
        this.timeout = setTimeout(() => {
          this.next({ enabled: false, payload: null });
        }, this.duration);
      }
    }
  }
}
