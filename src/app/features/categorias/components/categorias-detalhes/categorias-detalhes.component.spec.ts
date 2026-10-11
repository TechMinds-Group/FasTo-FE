import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CategoriasDetalhesComponent } from './categorias-detalhes.component';

describe('CategoriasDetalhesComponent', () => {
  let component: CategoriasDetalhesComponent;
  let fixture: ComponentFixture<CategoriasDetalhesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasDetalhesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .compileComponents();

    fixture = TestBed.createComponent(CategoriasDetalhesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
