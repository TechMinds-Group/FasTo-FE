import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TmModalComponent } from '@techminds-group/tm-angular-lib';
import { CatalogoCategoria } from '../../../../../core/models/catalogo-categoria/catalogo-categoria.model';

@Component({
  selector: 'app-categorias-modal-excluir',
  standalone: true,
  imports: [CommonModule, TmModalComponent],
  templateUrl: './categorias-modal-excluir.component.html',
  styleUrl: './categorias-modal-excluir.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasModalExcluirComponent {
  readonly show = model<boolean>(false);
  readonly categoria = input.required<CatalogoCategoria>();

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected onConfirm(): void {
    this.confirm.emit();
  }

  protected onCancel(): void {
    this.show.set(false);
    this.cancel.emit();
  }
}
