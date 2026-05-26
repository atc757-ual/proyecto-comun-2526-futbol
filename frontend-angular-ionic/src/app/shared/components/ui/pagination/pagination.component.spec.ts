import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('getPages() should return empty array when totalPages <= 1', () => {
    component.totalPages = 1;
    expect(component.getPages()).toEqual([]);
  });

  it('getPages() should return all pages when totalPages <= 5', () => {
    component.totalPages = 3;
    component.currentPage = 1;
    expect(component.getPages()).toEqual([1, 2, 3]);
  });

  it('onPrev() should emit pageChange with currentPage - 1', () => {
    component.currentPage = 3;
    component.totalPages = 5;
    spyOn(component.pageChange, 'emit');
    component.onPrev();
    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it('onPrev() should NOT emit when on first page', () => {
    component.currentPage = 1;
    spyOn(component.pageChange, 'emit');
    component.onPrev();
    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('onNext() should emit pageChange with currentPage + 1', () => {
    component.currentPage = 2;
    component.totalPages = 5;
    spyOn(component.pageChange, 'emit');
    component.onNext();
    expect(component.pageChange.emit).toHaveBeenCalledWith(3);
  });

  it('onNext() should NOT emit when on last page', () => {
    component.currentPage = 5;
    component.totalPages = 5;
    spyOn(component.pageChange, 'emit');
    component.onNext();
    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('onGoTo() should emit pageChange for valid different page', () => {
    component.currentPage = 2;
    component.totalPages = 5;
    spyOn(component.pageChange, 'emit');
    component.onGoTo(4);
    expect(component.pageChange.emit).toHaveBeenCalledWith(4);
  });

  it('onGoTo() should NOT emit when target page equals current page', () => {
    component.currentPage = 3;
    component.totalPages = 5;
    spyOn(component.pageChange, 'emit');
    component.onGoTo(3);
    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });
});
