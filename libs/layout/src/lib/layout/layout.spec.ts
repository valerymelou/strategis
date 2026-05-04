import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Layout } from './layout';
import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { provideRouter } from '@angular/router';

@Component({
  selector: 'app-navbar',
  template: 'navbar works',
})
class MockNavbar {}

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideRouter([])],
    })
      .overrideComponent(Layout, {
        add: { imports: [MockNavbar] },
        remove: { imports: [Navbar] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
