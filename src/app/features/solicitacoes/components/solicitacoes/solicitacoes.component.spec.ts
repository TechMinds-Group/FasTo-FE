import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SolicitacoesComponent } from './solicitacoes.component';

describe('SolicitacoesComponent', () => {
  let component: SolicitacoesComponent;
  let fixture: ComponentFixture<SolicitacoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitacoesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .compileComponents();

    fixture = TestBed.createComponent(SolicitacoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
