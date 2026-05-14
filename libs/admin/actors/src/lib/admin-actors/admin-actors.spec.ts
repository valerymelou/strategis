import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ActorService } from '@strategis/profiles/data-access';
import { AdminActors } from './admin-actors';

const mockResult = (data: unknown[] = [], meta = { pagination: { count: 0, page: 1, pages: 1 } }) =>
  ({ data, meta } as ReturnType<ActorService['listAll']> extends import('rxjs').Observable<infer T> ? T : never);

describe('AdminActors', () => {
  let component: AdminActors;
  let fixture: ComponentFixture<AdminActors>;
  let actorService: { listAll: jest.Mock };

  beforeEach(async () => {
    actorService = { listAll: jest.fn().mockReturnValue(of(mockResult())) };

    await TestBed.configureTestingModule({
      imports: [AdminActors],
      providers: [
        provideRouter([]),
        { provide: ActorService, useValue: actorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminActors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls listAll on init', () => {
    expect(actorService.listAll).toHaveBeenCalledWith({ 'page[number]': '1' });
  });

  it('sets isLoading false after data loads', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('sets actors from response', () => {
    const actors = [{ id: 'a1' }, { id: 'a2' }];
    actorService.listAll.mockReturnValue(of(mockResult(actors, { pagination: { count: 2, page: 1, pages: 1 } })));

    component['load'](1, '');
    expect(component.actors()).toHaveLength(2);
  });

  it('sets pagination from response', () => {
    const paginationMeta = { pagination: { count: 40, page: 1, pages: 2 } };
    actorService.listAll.mockReturnValue(of(mockResult([], paginationMeta)));

    component['load'](1, '');
    expect(component.pagination()?.pages).toBe(2);
    expect(component.pagination()?.count).toBe(40);
  });

  it('sets isLoading false on error', () => {
    actorService.listAll.mockReturnValue(throwError(() => new Error('network error')));

    component['load'](1, '');
    expect(component.isLoading()).toBe(false);
  });

  it('passes status filter to listAll when set', () => {
    actorService.listAll.mockReturnValue(of(mockResult()));

    component['load'](1, 'pending');
    expect(actorService.listAll).toHaveBeenCalledWith({
      'page[number]': '1',
      'filter[status]': 'pending',
    });
  });

  it('does not include filter[status] when empty', () => {
    actorService.listAll.mockReturnValue(of(mockResult()));

    component['load'](1, '');
    const call = actorService.listAll.mock.calls.at(-1)![0];
    expect(call).not.toHaveProperty('filter[status]');
  });

  it('onStatusChange updates statusFilter and resets page to 1', () => {
    component.page.set(3);
    const event = { target: { value: 'active' } } as unknown as Event;

    component.onStatusChange(event);

    expect(component.statusFilter()).toBe('active');
    expect(component.page()).toBe(1);
  });

  it('onPageChange updates page signal', () => {
    component.onPageChange(4);
    expect(component.page()).toBe(4);
  });

  it('has localized status options', () => {
    const values = component.statusOptions.map((o) => o.value);
    expect(values).toEqual(['', 'pending', 'awaiting_documents', 'active', 'rejected', 'revoked']);
  });
});
