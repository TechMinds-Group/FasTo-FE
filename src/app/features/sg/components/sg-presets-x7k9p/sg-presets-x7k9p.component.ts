import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

export interface SegmentPresetItem {
  id: string;
  nome: string;
  icone: string;
  descricao?: string;
  isPadraoSistema: boolean;
  permissoesMenusJson?: string;
  whatsAppBoasVindas?: string;
  whatsAppEncerramento?: string;
  whatsAppLembrete1Dia?: string;
  whatsAppLembrete4h?: string;
  opcoesMenuJson?: string;
}

@Component({
  selector: 'app-sg-presets-x7k9p',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sg-presets-x7k9p.component.html',
  styleUrl: './sg-presets-x7k9p.component.scss'
})
export class SgPresetsX7k9pComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  protected themeService = inject(ThemeService);

  protected presets = signal<SegmentPresetItem[]>([]);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarPresets();
  }

  carregarPresets(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.getSgPresets().subscribe({
      next: (data) => {
        this.presets.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar lista de presets.');
        this.isLoading.set(false);
      }
    });
  }

  abrirNovo(): void {
    this.router.navigate(['/sg-preset-detalhes-x7k9p', 'novo']);
  }

  abrirDetalhes(presetId: string): void {
    this.router.navigate(['/sg-preset-detalhes-x7k9p', presetId]);
  }
}
