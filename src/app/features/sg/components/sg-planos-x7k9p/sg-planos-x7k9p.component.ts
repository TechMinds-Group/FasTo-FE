import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TmModalComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-planos-x7k9p',
  standalone: true,
  imports: [CommonModule, FormsModule, TmModalComponent],
  templateUrl: './sg-planos-x7k9p.component.html',
  styleUrl: './sg-planos-x7k9p.component.scss'
})
export class SgPlanosX7k9pComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(TmToastService);

  protected planos = signal<any[]>([]);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);
  protected showDeleteModal = signal(false);
  protected planoToDelete = signal<any | null>(null);
  protected isDeleting = signal(false);

  ngOnInit(): void {
    this.carregarPlanos();
  }

  carregarPlanos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getSgPlanos().subscribe({
      next: (data) => {
        this.planos.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Falha ao carregar planos.');
        this.isLoading.set(false);
      }
    });
  }

  novo(): void {
    this.router.navigate(['/sg-plano-novo-x7k9p']);
  }

  verDetalhes(plano: any): void {
    this.router.navigate(['/sg-plano-editar-x7k9p', plano.id]);
  }

  confirmarExclusao(plano: any): void {
    this.planoToDelete.set(plano);
    this.showDeleteModal.set(true);
  }

  async excluir(): Promise<void> {
    const plano = this.planoToDelete();
    if (!plano) { return; }

    this.isDeleting.set(true);
    try {
      await this.authService.deleteSgPlano(plano.id).toPromise();
      this.toastService.success(`Plano "${plano.nome}" excluído.`, 'Sucesso');
      this.showDeleteModal.set(false);
      this.planoToDelete.set(null);
      this.carregarPlanos();
    } catch {
      this.toastService.error('Erro ao excluir plano.', 'Erro');
    } finally {
      this.isDeleting.set(false);
    }
  }

  corCiclo(ciclo: string): string {
    switch (ciclo?.toLowerCase()) {
      case 'semanal': return 'bg-warning text-dark';
      case 'mensal': return 'bg-primary text-white';
      case 'anual': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  }
}