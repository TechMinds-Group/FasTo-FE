import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
@Component({
  selector: 'app-sg-estabelecimento-detalhes-x7k9p',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sg-estabelecimento-detalhes-x7k9p.component.html',
  styleUrl: './sg-estabelecimento-detalhes-x7k9p.component.scss'
})
export class SgEstabelecimentoDetalhesX7k9pComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected empresa = signal<any | null>(null);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarDetalhes(id);
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
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Falha ao carregar detalhes do estabelecimento.');
        this.isLoading.set(false);
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/sg-estabelecimentos-x7k9p']);
  }
}
