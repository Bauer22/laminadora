-- ============================================================
-- LAMINADORA — Schema Supabase
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- ── EXTENSÕES ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── TABELAS DE CADASTRO ────────────────────────────────────

create table if not exists motoristas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cpf text,
  telefone text,
  cnh text,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists veiculos (
  id uuid primary key default uuid_generate_v4(),
  placa text not null unique,
  tipo text,
  marca text,
  modelo text,
  ano int,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists fornecedores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  tipo text default 'toras',
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ── PÁTIO DE TORAS ────────────────────────────────────────

create table if not exists entradas_madeira (
  id uuid primary key default uuid_generate_v4(),
  data date not null default current_date,
  tipo_medicao text not null check (tipo_medicao in ('peso','estereo')),
  fornecedor_id uuid references fornecedores(id),
  motorista_id uuid references motoristas(id),
  placa text,
  classe text,
  -- peso
  peso_bruto numeric(10,3) default 0,
  peso_tara  numeric(10,3) default 0,
  peso_liquido numeric(10,3) default 0,
  -- estéreo
  altura numeric(8,3) default 0,
  comprimento numeric(8,3) default 0,
  largura numeric(8,3) default 0,
  volume_estereo numeric(10,3) default 0,
  obs text,
  created_at timestamptz default now()
);

-- ── CARREGAMENTOS ─────────────────────────────────────────

create table if not exists carregamentos_cavaco (
  id uuid primary key default uuid_generate_v4(),
  data date not null default current_date,
  cliente_id uuid references clientes(id),
  motorista_id uuid references motoristas(id),
  placa text,
  peso_bruto numeric(10,3) default 0,
  peso_tara  numeric(10,3) default 0,
  peso_liquido numeric(10,3) default 0,
  obs text,
  created_at timestamptz default now()
);

create table if not exists carregamentos_lamina (
  id uuid primary key default uuid_generate_v4(),
  data date not null default current_date,
  cliente_id uuid references clientes(id),
  motorista_id uuid references motoristas(id),
  placa text,
  bitola numeric(6,2) default 0,
  qtd_folhas int default 0,
  comprimento numeric(8,3) default 0,
  largura numeric(8,3) default 0,
  volume_m3 numeric(10,4) default 0,
  obs text,
  created_at timestamptz default now()
);

-- ── FINANCEIRO ────────────────────────────────────────────

create table if not exists contas_pagar (
  id uuid primary key default uuid_generate_v4(),
  data_emissao date not null default current_date,
  data_vencimento date,
  data_pagamento date,
  fornecedor_id uuid references fornecedores(id),
  descricao text not null,
  centro_custo text not null,
  sub_centro_custo text,
  valor numeric(12,2) not null default 0,
  status text default 'pendente' check (status in ('pendente','pago','vencido','cancelado')),
  obs text,
  created_at timestamptz default now()
);

-- ── COMPENSADOS ───────────────────────────────────────────

create table if not exists compensado_entradas (
  id uuid primary key default uuid_generate_v4(),
  data date not null default current_date,
  tipo text not null,
  espessura numeric(6,2) default 0,
  qtd_chapas int default 0,
  fornecedor_id uuid references fornecedores(id),
  valor_unitario numeric(10,2) default 0,
  obs text,
  created_at timestamptz default now()
);

create table if not exists compensado_saidas (
  id uuid primary key default uuid_generate_v4(),
  data date not null default current_date,
  tipo text not null,
  espessura numeric(6,2) default 0,
  qtd_chapas int default 0,
  cliente_id uuid references clientes(id),
  valor_unitario numeric(10,2) default 0,
  desconto_pct numeric(5,2) default 0,
  valor_total numeric(12,2) default 0,
  obs text,
  created_at timestamptz default now()
);

-- ── COMBUSTÍVEL ───────────────────────────────────────────

create table if not exists combustivel_compras (
  id uuid primary key default uuid_generate_v4(),
  data date not null default current_date,
  tipo text not null check (tipo in ('diesel','gasolina','etanol','arla')),
  fornecedor_id uuid references fornecedores(id),
  qtd_litros numeric(10,2) not null default 0,
  valor_litro numeric(8,4) default 0,
  valor_total numeric(12,2) default 0,
  vencimento_boleto date,
  obs text,
  created_at timestamptz default now()
);

create table if not exists combustivel_saidas (
  id uuid primary key default uuid_generate_v4(),
  data date not null default current_date,
  tipo text not null check (tipo in ('diesel','gasolina','etanol','arla')),
  destino_tipo text not null check (destino_tipo in ('veiculo','maquina')),
  placa text,
  maquina text,
  motorista_id uuid references motoristas(id),
  qtd_litros numeric(10,2) not null default 0,
  km numeric(10,0),
  obs text,
  created_at timestamptz default now()
);

-- ── RLS POLICIES ─────────────────────────────────────────
-- Habilitar RLS em todas as tabelas
alter table motoristas enable row level security;
alter table veiculos enable row level security;
alter table fornecedores enable row level security;
alter table clientes enable row level security;
alter table entradas_madeira enable row level security;
alter table carregamentos_cavaco enable row level security;
alter table carregamentos_lamina enable row level security;
alter table contas_pagar enable row level security;
alter table compensado_entradas enable row level security;
alter table compensado_saidas enable row level security;
alter table combustivel_compras enable row level security;
alter table combustivel_saidas enable row level security;

-- Política: usuários autenticados têm acesso total
create policy "auth_users_all" on motoristas for all to authenticated using (true) with check (true);
create policy "auth_users_all" on veiculos for all to authenticated using (true) with check (true);
create policy "auth_users_all" on fornecedores for all to authenticated using (true) with check (true);
create policy "auth_users_all" on clientes for all to authenticated using (true) with check (true);
create policy "auth_users_all" on entradas_madeira for all to authenticated using (true) with check (true);
create policy "auth_users_all" on carregamentos_cavaco for all to authenticated using (true) with check (true);
create policy "auth_users_all" on carregamentos_lamina for all to authenticated using (true) with check (true);
create policy "auth_users_all" on contas_pagar for all to authenticated using (true) with check (true);
create policy "auth_users_all" on compensado_entradas for all to authenticated using (true) with check (true);
create policy "auth_users_all" on compensado_saidas for all to authenticated using (true) with check (true);
create policy "auth_users_all" on combustivel_compras for all to authenticated using (true) with check (true);
create policy "auth_users_all" on combustivel_saidas for all to authenticated using (true) with check (true);

-- ── SEED DATA ─────────────────────────────────────────────

insert into motoristas (nome) values
  ('COMPRA'),('NALDO'),('ALAN'),('CELSO'),('ELITON'),('RAFAEL'),
  ('IVALDIR'),('PAULO'),('ROBERTO'),('EMPILHADEIRA'),('CARREGADEIRA'),
  ('RANGER'),('GALÃO AZUL'),('CLAUDIO'),('EVERTON'),('FELIPE'),
  ('TONI'),('CLAUDEMIR'),('MATO'),('GAUCHO'),('LEANDER'),('ADILSON'),('MUNCK')
on conflict do nothing;

insert into veiculos (placa, tipo) values
  ('ABJ-7J85','Bitruck'),('AWW-5D67','Bitrem mato'),('BAZ-3J03','Julieta mato'),
  ('BCS-2F43','Julieta mato'),('BDA-2F82','Julieta mato'),('BDG-7J18','Julieta mato'),
  ('BEJ-7G45','Carreta porto'),('IVY-4E01','Bitrem mato'),('MAV-3C72','Carreta porto'),
  ('MJN-4C97','Carreta porto'),('RHH-2A24','Bitrem mato'),('SEH-3D67','Julieta mato'),
  ('MJM-4C97','Carreta'),('EMPILHADEIRA','Máquina'),('CARREGADEIRA','Máquina'),
  ('RANGER','Veículo'),('GALÃO AZUL','Máquina')
on conflict do nothing;

insert into fornecedores (nome, tipo) values
  ('MADESOZO','toras'),('ALIANÇA','toras'),('QUISSINI','toras'),('FATIMA','toras')
on conflict do nothing;

insert into clientes (nome) values
  ('BORDIN'),('FOREST CAVACO')
on conflict do nothing;
