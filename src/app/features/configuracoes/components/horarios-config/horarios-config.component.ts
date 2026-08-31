import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TmTimeComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { EstabelecimentoService } from '../../../../core/services/estabelecimento.service';
import {
  DiaFuncionamento,
  DIAS_SEMANA_ESTABELECIMENTO,
} from '../../../../core/models/configuracoes/horario-estabelecimento.model';

@Component({
  selector: 'app-horarios-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TmTimeComponent],
  templateUrl: './horarios-config.component.html',
  styleUrl: './horarios-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosConfigComponent implements OnInit {
  private readonly estabelecimentoService = inject(EstabelecimentoService);
  private readonly toastService = inject(TmToastService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly diasFuncionamento = signal<DiaFuncionamento[]>([]);
  protected readonly salvando = signal(false);

  protected readonly DIAS_SEMANA_LABELS = DIAS_SEMANA_ESTABELECIMENTO;

  async ngOnInit(): Promise<void> {
    await this.carregarHorarios();
  }

  protected async carregarHorarios(): Promise<void> {
    const data = await this.estabelecimentoService.carregarHorarios();
    this.diasFuncionamento.set(structuredClone(data));
    this.cdr.markForCheck();
  }

  protected voltar(): void {
    this.router.navigate(['/configuracoes']);
  }

  protected copiarParaTodos(diaOrigem: DiaFuncionamento): void {
    const lista = this.diasFuncionamento();
    const atualizado = lista.map((d) => ({
      ...d,
      ativo: diaOrigem.ativo,
      horaAbertura: diaOrigem.horaAbertura,
      horaFechamento: diaOrigem.horaFechamento,
      temIntervalo: diaOrigem.temIntervalo,
      intervaloInicio: diaOrigem.intervaloInicio,
      intervaloFim: diaOrigem.intervaloFim,
    }));
    this.diasFuncionamento.set(atualizado);
    const nomeDia = DIAS_SEMANA_ESTABELECIMENTO[diaOrigem.diaSemana]?.label;
    this.toastService.success(`Horários de ${nomeDia} copiados para todos os dias!`);
  }

  protected async salvar(): Promise<void> {
    this.salvando.set(true);
    try {
      await this.estabelecimentoService.salvarHorarios(this.diasFuncionamento());
      this.toastService.success('Horários de funcionamento salvos com sucesso!');
    } catch {
      this.toastService.error('Erro ao salvar horários. Tente novamente.');
    } finally {
      this.salvando.set(false);
      this.cdr.markForCheck();
    }
  }
}
