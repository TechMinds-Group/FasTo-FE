import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-sg-planos-x7k9p',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sg-planos-x7k9p.component.html',
  styleUrl: './sg-planos-x7k9p.component.scss'
})
export class SgPlanosX7k9pComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected themeService = inject(ThemeService);

  protected planos = signal<any[]>([]);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);

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
    this.router.navigate(['/sg-plano-editar-x7k9p', 'novo']);
  }

  verDetalhes(plano: any): void {
    this.router.navigate(['/sg-plano-editar-x7k9p', plano.id]);
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