import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TmSelectComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-estabelecimento-detalhes-x7k9p',
  standalone: true,
  imports: [CommonModule, FormsModule, TmSelectComponent],
  templateUrl: './sg-estabelecimento-detalhes-x7k9p.component.html',
  styleUrl: './sg-estabelecimento-detalhes-x7k9p.component.scss'
})
export class SgEstabelecimentoDetalhesX7k9pComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(TmToastService);
  protected themeService = inject(ThemeService);

  protected empresa = signal<any | null>(null);
  protected usuarios = signal<any[]>([]);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);

  protected planosDisponiveis = signal<any[]>([]);
  protected planosOptions = computed(() =>
    this.planosDisponiveis()
      .filter(p => p.status === 'Ativo')
      .map(p => ({ value: p.id, label: `${p.nome} - R$ ${p.valor.toFixed(2)}/${p.ciclo}` }))
  );
  protected selectedPlanoId = signal<string>('');
  protected savingPlano = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarDetalhes(id);
      this.carregarPlanos();
    } else {
      this.errorMessage.set('Identificador da empresa inválido.');
      this.isLoading.set(false);
    }
  }

  carregarDetalhes(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getSgEmpresaById(id).subscribe({
      next: (data) => {
        this.empresa.set(data);
        if (data.usuarios) {
          this.usuarios.set(data.usuarios);
        }
        if (data.planoSistemaId) {
          this.selectedPlanoId.set(data.planoSistemaId);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Falha ao carregar detalhes do estabelecimento.');
        this.isLoading.set(false);
      }
    });
  }

  carregarPlanos(): void {
    this.authService.getSgPlanos().subscribe({
      next: (data) => {
        this.planosDisponiveis.set(data || []);
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/sg-estabelecimentos-x7k9p']);
  }

  novoUsuario(): void {
    const id = this.empresa()?.id;
    if (id) {
      this.router.navigate(['/sg-usuario-novo-x7k9p', id]);
    }
  }

  async salvarPlano(): Promise<void> {
    const emp = this.empresa();
    if (!emp) { return; }

    this.savingPlano.set(true);
    try {
      const selectedId = this.selectedPlanoId();
      const plano = this.planosDisponiveis().find(p => p.id === selectedId);

      await this.authService.updateSgEmpresaPlano(emp.id, {
        planoSistemaId: selectedId || null,
        planoAssinatura: plano ? plano.nome : null,
        statusAssinatura: 'Ativo',
        assinaturaValidaAte: emp.assinaturaValidaAte || new Date(Date.now() + 365 * 86400000).toISOString(),
      }).toPromise();

      this.toastService.success('Plano atualizado com sucesso!', 'Sucesso');
      this.carregarDetalhes(emp.id);
    } catch {
      this.toastService.error('Erro ao salvar plano.', 'Erro');
    } finally {
      this.savingPlano.set(false);
    }
  }
}