import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvironmentsMenuComponent } from './environments-menu.component';

describe('EnvironmentsMenuComponent', () => {
  let component: EnvironmentsMenuComponent;
  let fixture: ComponentFixture<EnvironmentsMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnvironmentsMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvironmentsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
