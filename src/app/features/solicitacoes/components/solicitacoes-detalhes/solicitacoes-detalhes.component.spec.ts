import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SolicitacoesDetalhesComponent } from './solicitacoes-detalhes.component';

describe('SolicitacoesDetalhesComponent', () => {
  let component: SolicitacoesDetalhesComponent;
  let fixture: ComponentFixture<SolicitacoesDetalhesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitacoesDetalhesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .compileComponents();

    fixture = TestBed.createComponent(SolicitacoesDetalhesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
