import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PremiumUpgradeRequestService } from '@strategis/profiles/data-access';
import { AdminPremium } from './admin-premium';

const mockResult = (data: unknown[] = [], meta = { pagination: { count: 0, page: 1, pages: 1 } }) =>
  ({ data, meta } as ReturnType<PremiumUpgradeRequestService['listAll']> extends import('rxjs').Observable<infer T> ? T : never);

describe('AdminPremium', () => {
  let component: AdminPremium;
  let fixture: ComponentFixture<AdminPremium>;
  let premiumService: { listAll: jest.Mock };

  beforeEach(async () => {
    premiumService = { listAll: jest.fn().mockReturnValue(of(mockResult())) };

    await TestBed.configureTestingModule({
      imports: [AdminPremium],
      providers: [
        provideRouter([]),
        { provide: PremiumUpgradeRequestService, useValue: premiumService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPremium);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls listAll on init', () => {
    expect(premiumService.listAll).toHaveBeenCalledWith({ 'page[number]': '1' });
  });

  it('sets isLoading false after data loads', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('sets requests from response', () => {
    const requests = [{ id: 'r1' }, { id: 'r2' }];
    premiumService.listAll.mockReturnValue(
      of(mockResult(requests, { pagination: { count: 2, page: 1, pages: 1 } })),
    );

    component['load'](1, '');
    expect(component.requests()).toHaveLength(2);
  });

  it('sets pagination from response', () => {
    premiumService.listAll.mockReturnValue(
      of(mockResult([], { pagination: { count: 50, page: 1, pages: 3 } })),
    );

    component['load'](1, '');
    expect(component.pagination()?.pages).toBe(3);
    expect(component.pagination()?.count).toBe(50);
  });

  it('sets isLoading false on error', () => {
    premiumService.listAll.mockReturnValue(throwError(() => new Error('network')));
    component['load'](1, '');
    expect(component.isLoading()).toBe(false);
  });

  it('passes status filter to listAll when set', () => {
    premiumService.listAll.mockReturnValue(of(mockResult()));
    component['load'](1, 'pending');
    expect(premiumService.listAll).toHaveBeenCalledWith({
      'page[number]': '1',
      'filter[status]': 'pending',
    });
  });

  it('does not include filter[status] when empty', () => {
    premiumService.listAll.mockReturnValue(of(mockResult()));
    component['load'](1, '');
    const call = premiumService.listAll.mock.calls.at(-1)![0];
    expect(call).not.toHaveProperty('filter[status]');
  });

  it('onStatusChange updates statusFilter and resets page to 1', () => {
    component.page.set(5);
    const event = { target: { value: 'activated' } } as unknown as Event;

    component.onStatusChange(event);

    expect(component.statusFilter()).toBe('activated');
    expect(component.page()).toBe(1);
  });

  it('onPageChange updates page signal', () => {
    component.onPageChange(2);
    expect(component.page()).toBe(2);
  });

  it('has localized status options', () => {
    const values = component.statusOptions.map((o) => o.value);
    expect(values).toEqual(['', 'pending', 'activated', 'rejected', 'expired']);
  });
});
