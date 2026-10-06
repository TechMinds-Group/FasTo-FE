import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TmTextComponent, TmSelectComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-estabelecimento-novo-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TmTextComponent, TmSelectComponent],
  templateUrl: './sg-estabelecimento-novo-x7k9p.component.html',
  styleUrl: './sg-estabelecimento-novo-x7k9p.component.scss'
})
export class SgEstabelecimentoNovoX7k9pComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(TmToastService);
  protected themeService = inject(ThemeService);

  protected salvando = signal<boolean>(false);
  protected planosDisponiveis = signal<any[]>([]);
  protected presetsDisponiveis = signal<any[]>([]);

  protected planosOptions = computed(() =>
    this.planosDisponiveis()
      .filter(p => p.status === 'Ativo')
      .map(p => ({ value: p.nome, label: `${p.nome} - R$ ${parseFloat(p.valor).toFixed(2)}/${p.ciclo}` }))
  );

  protected presetsOptions = computed(() => [
    { value: '', label: 'Nenhum / Padrão do Sistema' },
    ...this.presetsDisponiveis().map(p => ({
      value: p.id,
      label: `${p.icone || '📱'} ${p.nome}`
    }))
  ]);

  protected form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    nomeExibicao: ['', [Validators.maxLength(100)]],
    cnpj: ['', [Validators.required, Validators.maxLength(18)]],
    telefone: ['', [Validators.required, Validators.maxLength(20)]],
    planoAssinatura: ['FasTo Pro', [Validators.required]],
    presetId: [''],
    password: ['Admin@123', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.carregarPlanos();
    this.carregarPresets();
  }

  carregarPlanos(): void {
    this.authService.getSgPlanos().subscribe({
      next: (data) => {
        this.planosDisponiveis.set(data || []);
        if (data && data.length > 0) {
          const primeiroAtivo = data.find(p => p.status === 'Ativo');
          if (primeiroAtivo) {
            this.form.patchValue({ planoAssinatura: primeiroAtivo.nome });
          }
        }
      }
    });
  }

  carregarPresets(): void {
    this.authService.getSgPresets().subscribe({
      next: (data) => this.presetsDisponiveis.set(data || []),
      error: () => {}
    });
  }

  voltar(): void {
    this.router.navigate(['/sg-estabelecimentos-x7k9p']);
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Preencha os campos obrigatórios.', 'Atenção');
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.value;
      const res = await this.authService.createSgEmpresa({
        nome: raw.nome,
        nomeExibicao: raw.nomeExibicao || null,
        cnpj: (raw.cnpj || '').replace(/\D/g, ''),
        telefone: (raw.telefone || '').replace(/\D/g, ''),
        planoAssinatura: raw.planoAssinatura,
        presetId: raw.presetId || null,
        password: raw.password
      }).toPromise();

      const createdEmpresaId = res?.id || res?.empresaId || res?.tenantId;
      if (createdEmpresaId && raw.presetId) {
        try {
          await this.authService.aplicarSgPreset(createdEmpresaId, raw.presetId).toPromise();
        } catch {
          // Ignora se o preset já tiver sido aplicado pelo backend
        }
      }

      this.toastService.success(`Estabelecimento criado com sucesso! Admin: ${res?.emailAdmin}`, 'Sucesso');
      this.voltar();
    } catch (err: any) {
      const msg = err?.error?.message || 'Erro ao cadastrar estabelecimento.';
      this.toastService.error(msg, 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }
}