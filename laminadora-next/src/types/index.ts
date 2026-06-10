export interface Motorista {
  id: string
  nome: string
  cpf?: string
  telefone?: string
  cnh?: string
  ativo: boolean
  created_at?: string
}

export interface Veiculo {
  id: string
  placa: string
  tipo?: string
  marca?: string
  modelo?: string
  ano?: number
  ativo: boolean
  created_at?: string
}

export interface Fornecedor {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  tipo: string
  ativo: boolean
  created_at?: string
}

export interface Cliente {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  ativo: boolean
  created_at?: string
}

export interface EntradaMadeira {
  id: string
  data: string
  tipo_medicao: 'peso' | 'estereo'
  fornecedor_id?: string
  motorista_id?: string
  placa?: string
  classe?: string
  peso_bruto?: number
  peso_tara?: number
  peso_liquido?: number
  altura?: number
  comprimento?: number
  largura?: number
  volume_estereo?: number
  obs?: string
  created_at?: string
  fornecedor?: Fornecedor
  motorista?: Motorista
}

export interface CarregamentoCavaco {
  id: string
  data: string
  cliente_id?: string
  motorista_id?: string
  placa?: string
  peso_bruto?: number
  peso_tara?: number
  peso_liquido?: number
  obs?: string
  created_at?: string
  cliente?: Cliente
  motorista?: Motorista
}

export interface CarregamentoLamina {
  id: string
  data: string
  cliente_id?: string
  motorista_id?: string
  placa?: string
  bitola?: number
  qtd_folhas?: number
  comprimento?: number
  largura?: number
  volume_m3?: number
  obs?: string
  created_at?: string
  cliente?: Cliente
  motorista?: Motorista
}

export interface ContaPagar {
  id: string
  data_emissao: string
  data_vencimento?: string
  data_pagamento?: string
  fornecedor_id?: string
  descricao: string
  centro_custo: string
  sub_centro_custo?: string
  valor: number
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  obs?: string
  created_at?: string
  fornecedor?: Fornecedor
}

export interface CompensadoEntrada {
  id: string
  data: string
  tipo: string
  espessura?: number
  qtd_chapas?: number
  fornecedor_id?: string
  valor_unitario?: number
  obs?: string
  created_at?: string
  fornecedor?: Fornecedor
}

export interface CompensadoSaida {
  id: string
  data: string
  tipo: string
  espessura?: number
  qtd_chapas?: number
  cliente_id?: string
  valor_unitario?: number
  desconto_pct?: number
  valor_total?: number
  obs?: string
  created_at?: string
  cliente?: Cliente
}

export interface CombustivelCompra {
  id: string
  data: string
  tipo: 'diesel' | 'gasolina' | 'etanol' | 'arla'
  fornecedor_id?: string
  qtd_litros: number
  valor_litro?: number
  valor_total?: number
  vencimento_boleto?: string
  obs?: string
  created_at?: string
  fornecedor?: Fornecedor
}

export interface CombustivelSaida {
  id: string
  data: string
  tipo: 'diesel' | 'gasolina' | 'etanol' | 'arla'
  destino_tipo: 'veiculo' | 'maquina'
  placa?: string
  maquina?: string
  motorista_id?: string
  qtd_litros: number
  km?: number
  obs?: string
  created_at?: string
  motorista?: Motorista
}

export const CENTROS_CUSTO = [
  'MATERIA PRIMA','DIVERSAS','RH','MANUTENÇÃO','ADMINISTRATIVO',
  'ENERGIA','COMBUSTIVEL MAQUINAS','CUSTOS FIXOS',
  'BONIFICAÇÃO POR PRODUÇÃO','MANUTENÇÃO TERCEIROS',
  'MANUTENÇÃO/LUBRIFICAÇÃO MAQUINAS','INVESTIMENTO/MELHORIAS',
  'MATERIAIS PARA ESTOQUE','MANUTENÇÃO PÁTIO','CALDEIRA'
] as const

export const SUB_CENTROS: Record<string, string[]> = {
  'MANUTENÇÃO': ['TORNO','DESCASCADOR','PICADOR','CALDEIRA','CARREGADEIRA','EMPILHADEIRA','PÁTIO','RANGER','MOTOSSERRA'],
  'MANUTENÇÃO/LUBRIFICAÇÃO MAQUINAS': ['TORNO','DESCASCADOR','PICADOR','CALDEIRA','CARREGADEIRA','EMPILHADEIRA'],
  'MANUTENÇÃO PÁTIO': ['PÁTIO','RANGER','MOTOSSERRA'],
}

export const MAQUINAS_COMBUSTIVEL = [
  'TORNO','DESCASCADOR','PICADOR','CALDEIRA','CARREGADEIRA',
  'EMPILHADEIRA','RANGER','MOTOSSERRA','GALÃO AZUL'
]
