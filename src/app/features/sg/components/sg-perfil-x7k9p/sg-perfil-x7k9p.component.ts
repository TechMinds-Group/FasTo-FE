import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TmTextComponent } from '@techminds-group/tm-angular-lib';
import { AppFooterComponent } from '../../../../shared/components/footer/app-footer.component';

@Component({
  selector: 'app-sg-perfil-x7k9p',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TmTextComponent,
  ],
  templateUrl: './sg-perfil-x7k9p.component.html',
  styleUrls: ['./sg-perfil-x7k9p.component.scss'],
})
export class SgPerfilX7k9pComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoadingProfile = signal(false);
  isLoadingPassword = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  modoEdicaoPerfil = signal(false);

  // Informações do perfil master
  usuarioMaster = signal({
    user: 'micheladm',
    email: 'micheladm@fasto.com',
    nivel: 'SuperAdmin Master',
    tabela: 'SysAuditVault (Camuflada)',
    status: 'Ativo Master',
  });

  perfilForm = this.fb.group({
    novoUsuario: ['', [Validators.required]],
    novoEmail: ['', [Validators.required, Validators.email]],
  });

  senhaForm = this.fb.group({
    senhaAtual: ['', [Validators.required]],
    novaSenha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarNovaSenha: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const savedUser = sessionStorage.getItem('sg_login_usuario') || 'micheladm';
    this.usuarioMaster.update((u) => ({
      ...u,
      user: savedUser,
      email: `${savedUser}@fasto.com`,
    }));

    this.perfilForm.patchValue({
      novoUsuario: this.usuarioMaster().user,
      novoEmail: this.usuarioMaster().email,
    });
  }

  alternarModoEdicao(): void {
    this.modoEdicaoPerfil.set(!this.modoEdicaoPerfil());
    if (this.modoEdicaoPerfil()) {
      this.perfilForm.patchValue({
        novoUsuario: this.usuarioMaster().user,
        novoEmail: this.usuarioMaster().email,
      });
    }
  }

  salvarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.isLoadingProfile.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { novoUsuario, novoEmail } = this.perfilForm.value;
    const currentUsername = this.usuarioMaster().user;

    this.authService.sgUpdateProfile(currentUsername, novoUsuario!, novoEmail!).subscribe({
      next: (res) => {
        this.isLoadingProfile.set(false);
        this.usuarioMaster.update((u) => ({
          ...u,
          user: novoUsuario!,
          email: novoEmail!,
        }));
        sessionStorage.setItem('sg_login_usuario', novoUsuario!);
        this.modoEdicaoPerfil.set(false);
        this.successMessage.set(res.message || 'Perfil master SG atualizado com sucesso!');
      },
      error: (err) => {
        this.isLoadingProfile.set(false);
        this.errorMessage.set(err.error?.message || 'Falha ao atualizar perfil master SG.');
      },
    });
  }

  alterarSenha(): void {
    if (this.senhaForm.invalid) {
      this.senhaForm.markAllAsTouched();
      return;
    }

    const { senhaAtual, novaSenha, confirmarNovaSenha } = this.senhaForm.value;

    if (novaSenha !== confirmarNovaSenha) {
      this.errorMessage.set('A nova senha e a confirmação não conferem.');
      return;
    }

    this.isLoadingPassword.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.sgChangePassword(this.usuarioMaster().user, senhaAtual!, novaSenha!).subscribe({
      next: (res) => {
        this.isLoadingPassword.set(false);
        this.senhaForm.reset();
        this.successMessage.set(res.message || 'Senha master alterada com sucesso!');
      },
      error: (err) => {
        this.isLoadingPassword.set(false);
        this.errorMessage.set(err.error?.message || 'Falha ao alterar senha master.');
      },
    });
  }

  sairSG(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/sg-auth-x7k9p']);
    });
  }
}
