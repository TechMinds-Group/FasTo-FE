import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriasModalExcluirComponent } from './categorias-modal-excluir.component';
import { CatalogoCategoria } from '../../../../../core/models/catalogo-categoria/catalogo-categoria.model';

describe('CategoriasModalExcluirComponent', () => {
  let component: CategoriasModalExcluirComponent;
  let fixture: ComponentFixture<CategoriasModalExcluirComponent>;

  const categoria: CatalogoCategoria = {
    id: 'b3c1a1e2-0000-0000-0000-000000000001',
    nome: 'Cabelo',
    icone: null,
    ordem: 0,
    status: 'Ativo',
    quantidadeServicos: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasModalExcluirComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(CategoriasModalExcluirComponent);
    fixture.componentRef.setInput('categoria', categoria);
    fixture.componentRef.setInput('show', true);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve emitir confirm ao confirmar', () => {
    let confirmado = false;
    component.confirm.subscribe(() => (confirmado = true));

    component['onConfirm']();

    expect(confirmado).toBe(true);
  });

  it('deve fechar e emitir cancel ao cancelar', () => {
    let cancelado = false;
    component.cancel.subscribe(() => (cancelado = true));

    component['onCancel']();

    expect(component.show()).toBe(false);
    expect(cancelado).toBe(true);
  });
});
