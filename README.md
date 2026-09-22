# SindicoNet Partners — POC de integração para ERPs

POC em Angular 18 que serve de **exemplo para ERPs** que precisam se integrar ao SindicoNet AI. Demonstra como sincronizar **organizações, usuários, condomínios e documentos** com a API Partners e como **embutir a UI do SindicoNet IA** dentro de um sistema parceiro via `<iframe>`.

> Em sandbox, as URLs são `https://ai-api-sandbox.sindiconet.com.br` (API) e `https://sandbox.sindiconet.com.br/ia/` (UI).

## ⚠️ Aviso importante: cadastro de origens no backend

Antes de rodar esta POC (ou qualquer integração de ERP), **você precisa informar as origens (domínios + portas) que serão usadas ao administrador do SindicoNet AI** para que sejam cadastradas no backend. **Sem esse cadastro, o iframe não funciona** — a chamada de autenticação é bloqueada com `403 Forbidden` pela tabela de origens permitidas (`sn_PartnerAllowedOrigin`), mesmo que `X-Client-Id` / `X-Client-Secret` estejam corretos.

Origens que precisam ser liberadas:

- **Origem do dev server** (ex.: `https://localhost:3001` se for rodar localmente com a porta padrão).
- **Origem de produção do seu ERP** (ex.: `https://app.seu-erp.com.br`).

Como solicitar:

1. Identifique **todas** as origens que farão chamadas para `https://ai-api-sandbox.sindiconet.com.br` (sandbox) e `https://ai-api.sindiconet.com.br` (produção).
2. Envie a lista (com protocolo, host e porta) ao administrador do SindicoNet AI pedindo a inclusão na tabela `sn_PartnerAllowedOrigin` do seu parceiro.
3. Aguarde a confirmação **antes** de subir o ambiente.

Enquanto as origens não estiverem liberadas, o fluxo de `/sindiconet-ia` falhará com `403`. Veja a seção **Troubleshooting** abaixo.

## Documentação oficial

- API Partners (sandbox): https://ai-api-sandbox.sindiconet.com.br/docs/?api=partner-integration
- API Partners (produção): https://ai-api.sindiconet.com.br/docs/?api=partner-integration

## Stack

- Angular 18 (standalone components, signals, `OnPush`)
- TypeScript strict
- `HttpClient` com interceptor funcional que injeta `X-Client-Id` / `X-Client-Secret`
- Roteamento lazy por feature
- CSS puro (sem libs de UI)

## Visão geral dos fluxos

A POC expõe um menu lateral com quatro fluxos de CRUD singular (organizações, usuários, condomínios, documentos) e um quinto item que abre o iframe do SindicoNet IA já autenticado.

A navegação é **encadeada por contexto**: o usuário seleciona uma organização (e opcionalmente um condomínio) nas listagens e esse contexto é reaproveitado nas próximas telas dependentes:

```
Organizações (selecionar) → Usuários (da org)
                          → Condomínios (da org) → Documentos (do condo + user)
```

## Setup

1. Copie o exemplo de ambiente e preencha com as suas credenciais:

   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```

2. Edite `src/environments/environment.ts` com:

   - `apiBaseUrl` — geralmente `https://ai-api-sandbox.sindiconet.com.br`
   - `clientId` / `clientSecret` — fornecidos pelo admin do SindicoNet AI
   - `iframeUrl` — URL da UI que será embutida (`https://sandbox.sindiconet.com.br/ia/`)

> O arquivo `src/environments/environment.ts` está no `.gitignore`. **Nunca** commite credenciais reais. Para produção, troque o fetch client-side por um proxy reverso ou endpoint server-side que adicione os headers de partner — caso contrário o `clientSecret` fica exposto no bundle JS.

## Rodar

```bash
npm install
npm start
```

A aplicação sobe em `https://localhost:3001` com certificado self-signed. Se o navegador bloquear:

- Acesse `https://localhost:3001` uma vez e confie no certificado, **ou**
- Habilite `chrome://flags/#allow-insecure-localhost` (Chrome/Edge).

> **Por que porta 3001 + HTTPS?** O backend do SindicoNet AI aplica uma CORS policy estrita (`AllowEndpoint`) **antes** da policy permissiva `PartnerOrigins`. A lista do `AllowEndpoint` já contém `https://localhost:3001`, mas não `https://localhost:4200`. Além disso, o cookie de autenticação do iframe é `Secure; SameSite=None` — sem HTTPS local o cookie é rejeitado e o fluxo de auth quebra. A origem `https://localhost:3001` precisa estar allowlistada também na tabela `sn_PartnerAllowedOrigin` do parceiro.

## Como funciona o embed (SindicoNet IA via iframe)

O objetivo do embed é permitir que o usuário do ERP use o SindicoNet IA **sem login adicional**, já autenticado pelo ERP parceiro. O fluxo acontece em três camadas — ERP, API Partners e UI do SindicoNet — e é resumido abaixo:

1. **Contexto no ERP.** Antes de abrir o iframe, o ERP precisa ter um usuário SindicoNet AI selecionado como contexto (tela **Usuários** → botão "Usar"). Esse contexto é um `userId` (Guid) e um `email` de um usuário já existente no SindicoNet AI com `IsAccessConfirmed = true`.

2. **Autenticação via API Partners.** Ao navegar para a rota `/sindiconet-ia`, a `sindiconetIaGuard` (`src/app/features/sindiconet-ia/sindiconet-ia.guard.ts`) chama `POST {apiBaseUrl}/api/partner/users/authenticate` enviando `{ userId, email }` no corpo. O backend valida as credenciais do partner via `X-Client-Id` / `X-Client-Secret` (injetados pelo interceptor) e responde `200` setando o cookie `sindiconetaiIdentifier` (`HttpOnly; Secure; SameSite=None; Max-Age=1h`) no domínio da API. A chamada precisa ser feita com `withCredentials: true` para que o navegador aceite o cookie cross-origin.

3. **Renderização do iframe.** A guarda libera a rota e `SindiconetIaPage` monta `<iframe src={iframeUrl}>`. O JS interno do SindicoNet lê o cookie `sindiconetaiIdentifier` e o troca por um JWT próprio chamando `POST /api/auth/identifier-login` — a partir daí o usuário já está logado dentro do iframe.

Em resumo, o embed é **uma única chamada autenticada (`/api/partner/users/authenticate`)** que seta um cookie cross-origin, seguida da abertura do `<iframe>` apontando para a UI do SindicoNet. A UI cuida do resto trocando o cookie por um JWT interno.

```ts
// src/app/features/sindiconet-ia/sindiconet-ia.guard.ts (essência)
const { userId, userEmail } = state;
if (!userId || !userEmail) return router.createUrlTree(['/users']);
await firstValueFrom(auth.authenticate(userId, userEmail)); // seta cookie
return true;
```

```html
<!-- src/app/features/sindiconet-ia/sindiconet-ia.page.ts -->
<app-sindiconet-iframe [src]="iframeUrl" />
```

Para detalhes completos de payloads, headers e endpoints, consulte a documentação oficial em https://ai-api-sandbox.sindiconet.com.br/docs/?api=partner-integration.

## Endpoints utilizados (singulares)

Todas as chamadas passam pelo interceptor `partnerAuthInterceptor`, que adiciona `X-Client-Id` e `X-Client-Secret` em **toda** requisição **exceto** `/api/partner/users/authenticate`.

| Entidade | Endpoints |
|---|---|
| Auth | `POST /api/partner/users/authenticate` |
| Organizations | `POST/GET/PUT/DELETE /api/partner/organizations[/{id}]` |
| Users | `POST/GET/PUT/DELETE /api/partner/users[/{id}]` · `GET /api/partner/organizations/{orgId}/users` |
| Condominiums | `POST/GET/PUT/DELETE /api/partner/condominiums[/{id}]` · `GET /api/partner/organizations/{orgId}/condominiums` |
| Documents | `POST /api/partner/documents` (multipart, max 200 MB) · `GET /api/partner/documents` · `GET /api/partner/condominiums/{id}/documents` · `DELETE /api/partner/documents/{id}` |

## Estrutura

```
src/
  environments/
    environment.ts            ← GITIGNORED, com credenciais reais (preencher localmente)
    environment.example.ts    ← COMMITTED, placeholders
  app/
    app.config.ts             ← provides HttpClient + interceptor + PARTNER_CONFIG
    app.routes.ts
    app.component.ts          ← shell: <app-menu/> + <router-outlet/>
    core/
      config/partner.config.ts          ← InjectionToken<PartnerConfig>
      partners/
        partner.types.ts                ← DTOs
        partner-auth.interceptor.ts     ← X-Client-Id + X-Client-Secret
        authenticate.service.ts         ← /api/partner/users/authenticate
        organization.service.ts
        user.service.ts
        condominium.service.ts
        document.service.ts
        sync-state.service.ts           ← Signals compartilhados (org/condo/user)
        crud.service.ts                 ← loading/error wrapper + describePartnerError
    shared/
      sindiconet-iframe/sindiconet-iframe.component.ts
    features/
      menu/menu.component.{ts,html,css}
      sindiconet-ia/
        sindiconet-ia.page.ts
        sindiconet-ia.guard.ts
        auth-error.page.ts
      organizations/organizations.page.{ts,html,css}
      users/users.page.{ts,html,css}
      condominiums/condominiums.page.{ts,html,css}
      documents/documents.page.{ts,html,css}
```

## Troubleshooting

- **Iframe carrega mas o usuário fica deslogado.** Confirme que a origem do dev server está em `sn_PartnerAllowedOrigin` no backend e que o cookie `sindiconetaiIdentifier` foi setado no domínio da API (DevTools → Application → Cookies). Se o cookie está lá mas o iframe continua deslogado, investigue a chamada interna `POST /api/auth/identifier-login` na aba Network.
- **CORS error no console.** A origem rodando não está na CORS policy `AllowEndpoint` do backend. Use `https://localhost:3001` (já allowlistada) ou peça ao admin para liberar sua origem.
- **401 em `/api/partner/*`.** `X-Client-Id` / `X-Client-Secret` inválidos, ou partner inativo no banco.
- **403.** Origem não allowlistada em `sn_PartnerAllowedOrigin`.

## Build de produção

```bash
npm run build
```

Gera `dist/poc-partners/browser/`. **Atenção:** as credenciais do `environment.ts` são empacotadas no bundle JS — em produção real, use um proxy reverso ou endpoint server-side que adicione os headers `X-Client-Id` / `X-Client-Secret` antes de chegar na API Partners.
