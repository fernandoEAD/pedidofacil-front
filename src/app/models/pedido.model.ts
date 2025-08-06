import { ProdutoPedido } from './produto-pedido.model';

export interface Pedido {
  id?: number;
  nomeComprador: string;
  nomeFornecedor: string;
  valorTotalComprado?: number;
  totalProdutosComprados?: number;
  produtos?: ProdutoPedido[];
}
