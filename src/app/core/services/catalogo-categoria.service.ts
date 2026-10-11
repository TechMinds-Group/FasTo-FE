import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogoCategoria,
  CatalogoCategoriaPayload,
} from '../models/catalogo-categoria/catalogo-categoria.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogoCategoriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/catalogo-categorias`;

  private readonly _categorias = signal<CatalogoCategoria[]>([]);
  readonly categorias = this._categorias.asReadonly();

  async carregarCategorias(): Promise<void> {
    const data = await firstValueFrom(this.http.get<CatalogoCategoria[]>(this.apiUrl, { withCredentials: true }));
    this._categorias.set(data);
  }

  async adicionar(categoria: CatalogoCategoriaPayload): Promise<string> {
    return await firstValueFrom(this.http.post<string>(this.apiUrl, categoria, { withCredentials: true }));
  }

  async atualizar(id: string, dados: CatalogoCategoriaPayload): Promise<void> {
    await firstValueFrom(this.http.put(`${this.apiUrl}/${id}`, { id, ...dados }, { withCredentials: true }));
    await this.carregarCategorias();
  }

  /** Requer perfil de Administrador. Backend recusa (400) se a categoria tiver serviços vinculados. */
  async remover(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true }));
    await this.carregarCategorias();
  }
}
