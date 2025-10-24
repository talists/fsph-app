# Implementação do Ícone "Doar" na Navbar

## Alterações Realizadas

### 1. **Nova Tab "Doar" Adicionada**

**Local:** `frontend/app/(tabs)/_layout.tsx`

Adicionada nova tab entre "Feed" e "Benefícios" seguindo o padrão existente:

```tsx
<Tabs.Screen
  name="doar"
  options={{
    title: "Doar",
    tabBarIcon: ({ color }) => (
      <Ionicons name="water-outline" size={24} color={color} />
    ),
  }}
/>
```

### 2. **Página Placeholder Criada**

**Local:** `frontend/app/(tabs)/doar.tsx`

Criada página temporária com:
- Ícone de sangue (water) grande e centralizado
- Título "Página de Doação"
- Mensagem informativa sobre implementação futura
- Descrição do que a página terá quando pronta

### 3. **Características da Implementação**

#### **Ícone Utilizado**
- **Nome:** `water-outline` (para estado inativo)
- **Tamanho:** 24px (seguindo padrão)
- **Cor:** Dinâmica (vermelho quando ativo, cinza quando inativo)

#### **Posicionamento**
- **Ordem na navbar:** Home → Feed → **Doar** → Benefícios
- **Posição lógica:** Entre conteúdo social (feed) e informações (benefícios)

#### **Estilo Consistente**
- Segue o mesmo padrão de cores do app (#E73645)
- Usa a mesma estrutura de navegação
- Mantém consistência visual com outras tabs

## Estrutura da Navbar Atual

```
┌─────────┬─────────┬─────────┬─────────────┐
│  Home   │  Feed   │  Doar   │ Benefícios  │
│   🏠    │   📰    │   🩸    │     🎁      │
└─────────┴─────────┴─────────┴─────────────┘
```

## Funcionalidade Atual

### ✅ **Tab "Doar" Ativa**
- Aparece na navbar com ícone de sangue
- Navega para página de doação ao ser clicada
- Segue padrão visual das outras tabs

### ✅ **Página Temporária**
- Informa que será implementada em breve
- Mantém experiência consistente
- Placeholder profissional e informativo

### 🔄 **Para Implementação Futura**
A página `doar.tsx` pode ser substituída com:
- Formulário de agendamento de doação
- Mapa de postos de coleta
- Informações sobre tipos sanguíneos
- Histórico de doações do usuário
- Campanhas ativas

## Arquivos Modificados

1. **`_layout.tsx`** - Adicionada nova tab "Doar"
2. **`doar.tsx`** - Criada página placeholder

## Como Testar

1. Execute o app
2. Observe a navbar inferior
3. Veja o novo ícone "Doar" entre Feed e Benefícios
4. Toque no ícone para navegar para a página
5. Visualize a página placeholder com informações

A implementação está pronta para receber o conteúdo real da página de doação quando for desenvolvida por outra pessoa da equipe!