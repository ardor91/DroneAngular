import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPointDialogComponent } from './select-point-dialog.component';

describe('SelectPointDialogComponent', () => {
  let component: SelectPointDialogComponent;
  let fixture: ComponentFixture<SelectPointDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectPointDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPointDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
