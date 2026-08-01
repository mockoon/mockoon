import { Component, computed, inject } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { planLabels } from 'src/renderer/app/constants/user.constant';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-plan-indicator',
  template: `<div
    class="badge text-bg-warning"
    ngbTooltip="Your current cloud plan"
  >
    {{ currentPlan() }}
  </div>`,
  host: {
    class: 'd-flex align-items-center'
  },
  imports: [NgbTooltip]
})
export class PlanIndicatorComponent {
  private store = inject(Store);
  private userSignal = this.store.selectSignal('user');
  public currentPlan = computed(() =>
    this.userSignal()?.plan ? planLabels[this.userSignal()?.plan] : null
  );
}
