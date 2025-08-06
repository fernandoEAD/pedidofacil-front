import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Pedido } from '../models/pedido.model';
import { ProdutoPedido } from '../models/produto-pedido.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = `${environment.apiBaseUrl}/api/pedidos`;

  constructor(private http: HttpClient) { }

  // Listar todos os pedidos
  listarTodos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Buscar pedido por ID
  buscarPorId(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Criar novo pedido
  criar(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Atualizar pedido
  atualizar(id: number, pedido: Pedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}`, pedido)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Deletar pedido
  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Listar produtos de um pedido específico
  listarProdutosDoPedido(pedidoId: number): Observable<ProdutoPedido[]> {
    return this.http.get<ProdutoPedido[]>(`${this.apiUrl}/${pedidoId}/produtos`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Tratamento de erros
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Dados inválidos fornecidos';
          break;
        case 404:
          errorMessage = 'Pedido não encontrado';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        default:
          errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }

    console.error('Erro no PedidoService:', errorMessage);
    return throwError(errorMessage);
  }
}
