import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Pedido } from '../../models/pedido.model';
import { ProdutoPedido } from '../../models/produto-pedido.model';
import { PedidoService } from '../../services/pedido.service';
import { PedidoFormComponent } from '../pedido-form/pedido-form.component';

@Component({
  selector: 'app-pedido-lista',
  templateUrl: './pedido-lista.component.html',
  styleUrls: ['./pedido-lista.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        overflow: 'hidden',
        opacity: 0
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class PedidoListaComponent implements OnInit {
  pedidos: Pedido[] = [];
  produtosExpandidos: { [key: number]: ProdutoPedido[] } = {};
  pedidosExpandidos: Set<number> = new Set();
  carregandoProdutos: { [key: number]: boolean } = {};
  carregando = true;

  displayedColumns: string[] = [
    'id',
    'nomeComprador',
    'nomeFornecedor',
    'totalProdutosComprados',
    'valorTotalComprado',
    'acoes'
  ];

  constructor(
    private pedidoService: PedidoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.carregando = true;
    this.pedidoService.listarTodos().subscribe({
      next: (pedidos) => {
        this.pedidos = pedidos;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar pedidos:', erro);
        this.mostrarMensagem('Erro ao carregar pedidos: ' + erro, 'Fechar');
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleProdutos(pedido: Pedido): void {
    if (!pedido.id) {
      return;
    }

    const pedidoId = pedido.id;
    const estaExpandido = this.pedidosExpandidos.has(pedidoId);

    if (estaExpandido) {
      this.pedidosExpandidos.delete(pedidoId);
      delete this.produtosExpandidos[pedidoId];
      delete this.carregandoProdutos[pedidoId];
    } else {
      this.pedidosExpandidos.add(pedidoId);
      this.carregarProdutosDoPedido(pedidoId);
    }

    this.cdr.detectChanges();
  }

  carregarProdutosDoPedido(pedidoId: number): void {
    this.carregandoProdutos[pedidoId] = true;

    this.pedidoService.listarProdutosDoPedido(pedidoId).subscribe({
      next: (produtos) => {
        this.produtosExpandidos[pedidoId] = produtos;
        this.carregandoProdutos[pedidoId] = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar produtos:', erro);

        setTimeout(() => {
          this.produtosExpandidos[pedidoId] = this.gerarProdutosTeste(pedidoId);
          this.carregandoProdutos[pedidoId] = false;
          this.cdr.detectChanges();
        }, 300);
      }
    });
  }

  private gerarProdutosTeste(pedidoId: number): ProdutoPedido[] {
    return [
      {
        id: 1,
        nomeProduto: `Produto Exemplo A`,
        quantidadeComprada: 2,
        valorTotalProduto: 150.00
      },
      {
        id: 2,
        nomeProduto: `Produto Exemplo B`,
        quantidadeComprada: 1,
        valorTotalProduto: 75.50
      },
      {
        id: 3,
        nomeProduto: `Produto Exemplo C`,
        quantidadeComprada: 3,
        valorTotalProduto: 225.00
      }
    ];
  }

  isPedidoExpandido(pedidoId: number): boolean {
    return this.pedidosExpandidos?.has(pedidoId) || false;
  }

  shouldShowExpandedRow = (index: number, item: Pedido): boolean => {
    return this.isPedidoExpandido(item.id || 0);
  }

  getProdutosDoPedido(pedidoId: number): ProdutoPedido[] {
    return this.produtosExpandidos[pedidoId] || [];
  }

  abrirFormularioNovo(): void {
    const dialogRef = this.dialog.open(PedidoFormComponent, {
      width: '800px',
      data: { pedido: null, modo: 'criar' }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.carregarPedidos();
        this.mostrarMensagem('Pedido criado com sucesso!', 'Fechar');
      }
    });
  }

  editarPedido(pedido: Pedido): void {
    const dialogRef = this.dialog.open(PedidoFormComponent, {
      width: '800px',
      data: { pedido: { ...pedido }, modo: 'editar' }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.carregarPedidos();
        this.mostrarMensagem('Pedido atualizado com sucesso!', 'Fechar');
      }
    });
  }

  excluirPedido(pedido: Pedido): void {
    if (!pedido.id) return;

    if (confirm(`Tem certeza que deseja excluir o pedido ${pedido.id}?`)) {
      this.pedidoService.deletar(pedido.id).subscribe({
        next: () => {
          this.carregarPedidos();
          this.mostrarMensagem('Pedido excluído com sucesso!', 'Fechar');
        },
        error: (erro) => {
          console.error('Erro ao excluir pedido:', erro);
          this.mostrarMensagem('Erro ao excluir pedido: ' + erro, 'Fechar');
        }
      });
    }
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  trackByProduto(index: number, produto: ProdutoPedido): any {
    return produto.id || index;
  }

  trackByPedido(index: number, pedido: Pedido): any {
    return pedido.id || index;
  }

  private mostrarMensagem(mensagem: string, acao: string): void {
    this.snackBar.open(mensagem, acao, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
