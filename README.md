
# 🍺 BarDoLuis POS - Sistema de Gestão (V5.0)

Sistema de Ponto de Venda (PDV) e Business Intelligence (BI) desenvolvido sob medida para a operação na **Rua Tavares Bastos, Pompéia**.

## 🚀 Status Atual: PRODUCTION READY
O sistema está tecnicamente blindado e sincronizado com o banco de dados oficial `bardoluis`.

### 🛠️ Funcionalidades Implementadas:
- **Cockpit de B.I. Interativo**: Dashboard com drill-down de Receitas, Recebimentos, Lucros e Despesas.
- **Gestão de Comandas**: Abertura por Mesa, Cliente Fiel ou novo cadastro instantâneo.
- **Vínculo Retroativo**: Possibilidade de associar um cliente a uma comanda em curso.
- **Histórico de Clientes (Fieis)**: Registro automático de vendas e pagamentos no extrato do cliente, independente do meio de pagamento.
- **Controle de Inadimplência**: Filtros rápidos para identificação de saldos devedores (Fiado).
- **Relatórios Analíticos**: Auditoria detalhada por método de pagamento e categoria de despesa com scroll garantido.

### 🏗️ Tech Stack:
- **Framework**: Next.js 14 (App Router)
- **Database**: Firebase Firestore (Instância `bardoluis`)
- **Auth**: Firebase Authentication
- **UI**: Shadcn/UI + Tailwind CSS
- **Icons**: Lucide React

## 📥 Como fazer Backup no GitHub (Manual):

1. Crie um repositório vazio no seu GitHub.
2. No terminal do projeto, execute:
   ```bash
   git init
   git add .
   git commit -m "feat: Sistema v5.0 - Blindagem Final e BI"
   git remote add origin SEU_LINK_DO_GITHUB
   git push -u origin main
   ```

---
**CTO Note**: Este sistema foi otimizado para baixa latência e zero erros de runtime no ambiente de produção.
