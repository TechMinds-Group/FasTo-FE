import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CategoriasFormComponent } from './categorias-form.component';

describe('CategoriasFormComponent', () => {
  let component: CategoriasFormComponent;
  let fixture: ComponentFixture<CategoriasFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .compileComponents();

    fixture = TestBed.createComponent(CategoriasFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar em modo de criação quando não há id na rota', () => {
    expect(component['modoEdicao']()).toBe(false);
  });
});
