import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Pedido } from '../../models/pedido.model';
import { ProdutoPedido } from '../../models/produto-pedido.model';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-pedido-form',
  templateUrl: './pedido-form.component.html',
  styleUrls: ['./pedido-form.component.scss']
})
export class PedidoFormComponent implements OnInit {
  pedidoForm: FormGroup;
  modo: 'criar' | 'editar';
  salvando = false;

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PedidoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pedido: Pedido | null, modo: 'criar' | 'editar' }
  ) {
    this.modo = data.modo;
    this.pedidoForm = this.criarFormulario();
  }

  ngOnInit(): void {
    if (this.data.pedido && this.modo === 'editar') {
      this.carregarDadosPedido(this.data.pedido);
    } else {
      this.adicionarProduto();
    }
  }

  criarFormulario(): FormGroup {
    return this.fb.group({
      nomeComprador: ['', [Validators.required, Validators.minLength(2)]],
      nomeFornecedor: ['', [Validators.required, Validators.minLength(2)]],
      produtos: this.fb.array([])
    });
  }

  get produtos(): FormArray {
    return this.pedidoForm.get('produtos') as FormArray;
  }

  criarProdutoForm(produto?: ProdutoPedido): FormGroup {
    return this.fb.group({
      id: [produto?.id || null],
      nomeProduto: [produto?.nomeProduto || '', [Validators.required, Validators.minLength(2)]],
      quantidadeComprada: [produto?.quantidadeComprada || 1, [Validators.required, Validators.min(1)]],
      valorTotalProduto: [produto?.valorTotalProduto || 0, [Validators.required, Validators.min(0.01)]]
    });
  }

  adicionarProduto(): void {
    this.produtos.push(this.criarProdutoForm());
  }

  removerProduto(index: number): void {
    if (this.produtos.length > 1) {
      this.produtos.removeAt(index);
    } else {
      this.mostrarMensagem('É necessário ter pelo menos um produto', 'Fechar');
    }
  }

  carregarDadosPedido(pedido: Pedido): void {
    this.pedidoForm.patchValue({
      nomeComprador: pedido.nomeComprador,
      nomeFornecedor: pedido.nomeFornecedor
    });

    while (this.produtos.length !== 0) {
      this.produtos.removeAt(0);
    }

    if (pedido.produtos && pedido.produtos.length > 0) {
      pedido.produtos.forEach(produto => {
        this.produtos.push(this.criarProdutoForm(produto));
      });
    } else {
      this.adicionarProduto();
    }
  }

  calcularValorTotal(): number {
    return this.produtos.controls.reduce((total, produtoControl) => {
      const valor = produtoControl.get('valorTotalProduto')?.value || 0;
      return total + Number(valor);
    }, 0);
  }

  calcularTotalProdutos(): number {
    return this.produtos.controls.reduce((total, produtoControl) => {
      const quantidade = produtoControl.get('quantidadeComprada')?.value || 0;
      return total + Number(quantidade);
    }, 0);
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  onSubmit(): void {
    if (this.pedidoForm.valid) {
      this.salvando = true;

      const pedidoData: Pedido = {
        ...this.pedidoForm.value,
        id: this.data.pedido?.id
      };

      const operacao = this.modo === 'criar'
        ? this.pedidoService.criar(pedidoData)
        : this.pedidoService.atualizar(this.data.pedido!.id!, pedidoData);

      operacao.subscribe({
        next: (resultado) => {
          this.salvando = false;
          this.dialogRef.close(resultado);
        },
        error: (erro) => {
          console.error('Erro ao salvar pedido:', erro);
          this.mostrarMensagem('Erro ao salvar pedido: ' + erro, 'Fechar');
          this.salvando = false;
        }
      });
    } else {
      this.marcarCamposComoTocados();
      this.mostrarMensagem('Por favor, preencha todos os campos obrigatórios', 'Fechar');
    }
  }

  marcarCamposComoTocados(): void {
    this.pedidoForm.markAllAsTouched();
    this.produtos.controls.forEach(produtoControl => {
      produtoControl.markAllAsTouched();
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private mostrarMensagem(mensagem: string, acao: string): void {
    this.snackBar.open(mensagem, acao, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  get nomeComprador() { return this.pedidoForm.get('nomeComprador'); }
  get nomeFornecedor() { return this.pedidoForm.get('nomeFornecedor'); }
}
