# FasTo FE

Frontend web do **FasTo** (Angular + TypeScript). Interface da plataforma multissetorial de automação de atendimentos, agendamentos flexíveis e integração WhatsApp ("Fast to...").

## Propósito

Oferecer um portal web responsivo e moderno para gestão de estabelecimentos (clínicas, advocacia, madeireiras, ferragens, pequenos mercados, prestadores de serviços e comércios), permitindo gerenciar agendamentos, atendimentos, catálogo de serviços/produtos, equipe de atendentes/especialistas e fluxos de atendimento por WhatsApp.

## Stack

- Angular (standalone components, signals, control flow nativo)
- Bootstrap + Angular Material
- TM Angular Library (`tm-*` components)
- Font Awesome (ícones)
- SignalR (`@microsoft/signalr`) para atualização em tempo real da agenda e atendimentos

## Estrutura

- `src/app/core/` — serviços de API, modelos de domínio, guards, interceptors
- `src/app/features/<feature>/` — componentes, modais, pipes e helpers por feature
- `src/app/shared/` — código reutilizável entre features

## Desenvolvimento

```bash
npm install
npm start
```

Acessar: `http://localhost:4200` (proxy da API em `http://localhost:5000`).

## Tempo Real (SignalR)

O `AgendaHubService` (`src/app/core/services/agenda-hub.service.ts`) mantém a conexão com `/hubs/agenda` da API (autenticação via cookie) e expõe o sinal `eventVersion`, incrementado a cada evento `AgendamentosAlterados` recebido. Telas que consomem dados voláteis (ex.: agenda) observam esse sinal e recarregam os dados — sem polling por tempo. O serviço usa `automaticReconnect` e falhas de conexão não derrubam a tela.