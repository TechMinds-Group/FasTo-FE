import { TestBed } from '@angular/core/testing';
import { SolicitacoesNovoComponent } from './solicitacoes-novo.component';

describe('SolicitacoesNovoComponent', () => {
  it('should create', () => {
    TestBed.overrideProvider(SolicitacoesNovoComponent, { useValue: SolicitacoesNovoComponent });
    expect(SolicitacoesNovoComponent).toBeTruthy();
  });
});
