# SindicoNet Partners — POC de integração para ERPs

POC em Angular 18 que serve de **exemplo para ERPs** que precisam se integrar ao SindicoNet AI. Demonstra como sincronizar **organizações, usuários, condomínios e documentos** com a API Partners e como **embutir a UI do SindicoNet IA** dentro de um sistema parceiro via `<iframe>`.

> Em sandbox, as URLs são `https://ai-api-sandbox.sindiconet.com.br` (API) e `https://sandbox.sindiconet.com.br/ia/` (UI).

## ⚠️ Aviso importante: cadastro de origens no backend

Antes de rodar esta POC (ou qualquer integração de ERP), **você precisa informar as origens (domínios + portas) que serão usadas ao administrador do SindicoNet AI** para que sejam liberadas. Sem essa liberação:

- **o iframe não autentica o usuário:** o SindicoNet IA só aceita o token enviado por `postMessage` de origens liberadas;
- **o navegador bloqueia as chamadas à API Partners** por CORS;
- **no modo legado** (`X-Client-Id` / `X-Client-Secret`), a API responde `401` quando a origem não está na tabela `sn_PartnerAllowedOrigin` do parceiro.

Origens que precisam ser liberadas:

- **Origem do dev server** (ex.: `https://localhost:3001` se for rodar localmente com a porta padrão).
- **Origem de produção do seu ERP** (ex.: `https://app.seu-erp.com.br`).

Como solicitar:

1. Identifique **todas** as origens que farão chamadas para `https://ai-api-sandbox.sindiconet.com.br` (sandbox) e `https://ai-api.sindiconet.com.br` (produção).
2. Envie a lista (com protocolo, host e porta) ao administrador do SindicoNet AI pedindo a liberação para o seu parceiro.
3. Aguarde a confirmação **antes** de subir o ambiente.

Enquanto as origens não estiverem liberadas, o SindicoNet IA abre sem usuário logado em `/sindiconet-ia`. Veja a seção **Troubleshooting** abaixo.

## Documentação oficial

- API Partners (sandbox): https://ai-api-sandbox.sindiconet.com.br/docs/?api=partner-integration
- API Partners (produção): https://ai-api.sindiconet.com.br/docs/?api=partner-integration

## Stack

- Angular 18 (standalone components, signals, `OnPush`)
- TypeScript strict
- `HttpClient` com interceptor funcional que autentica o parceiro: Bearer do Keycloak ou `X-Client-Id` / `X-Client-Secret` (legado)
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
   - `clientId` / `clientSecret` — fornecidos pelo admin do SindicoNet AI: o client do Keycloak ou as credenciais legadas
   - `tokenUrl` — endpoint de token do Keycloak; sem ele, a POC usa as credenciais legadas (veja **Autenticação do parceiro**)
   - `iframeUrl` — URL da UI que será embutida (`https://sandbox.sindiconet.com.br/ia/`)

> O arquivo `src/environments/environment.ts` está no `.gitignore`. **Nunca** commite credenciais reais. Para produção, troque o fetch client-side por um proxy reverso ou endpoint server-side que autentique o parceiro — caso contrário o `clientSecret` fica exposto no bundle JS.

## Rodar

```bash
npm install
npm start
```

A aplicação sobe em `https://localhost:3001` com certificado self-signed. Se o navegador bloquear:

- Acesse `https://localhost:3001` uma vez e confie no certificado, **ou**
- Habilite `chrome://flags/#allow-insecure-localhost` (Chrome/Edge).

> **Por que porta 3001?** O backend do SindicoNet AI aplica uma CORS policy estrita (`AllowEndpoint`) **antes** da policy permissiva `PartnerOrigins`. A lista do `AllowEndpoint` já contém `https://localhost:3001` e `http://localhost:3001`, mas não `localhost:4200`. O HTTPS é opcional: `npm run start:http` sobe em `http://localhost:3001`, desde que essa origem também esteja liberada no SindicoNet IA.

No modo Keycloak, o `ng serve` encaminha `/auth/realms/...` para o SSO do sandbox (`proxy.conf.json`), porque o Keycloak não libera CORS para o navegador. Para outro ambiente, ajuste o `target` do proxy.

## Autenticação do parceiro

O `partnerAuthInterceptor` autentica todas as chamadas a `/api/partner/` de um destes jeitos, conforme o `environment.ts`:

| Modo | Configuração | O que vai na chamada |
|---|---|---|
| Keycloak | `tokenUrl` + `clientId` / `clientSecret` do client no Keycloak | `Authorization: Bearer <token>` |
| Legado | sem `tokenUrl`; `clientId` / `clientSecret` gerados pela dashboard | `X-Client-Id` / `X-Client-Secret` |

No modo Keycloak, o `PartnerTokenService` pede o token com `client_credentials` e o reaproveita até 30 s antes de vencer. A API aceita os dois modos; a POC usa o que estiver configurado.

## Como funciona o embed (SindicoNet IA via iframe)

O objetivo do embed é permitir que o usuário do ERP use o SindicoNet IA **sem login adicional**, já autenticado pelo ERP parceiro. O fluxo acontece em três camadas — ERP, API Partners e UI do SindicoNet — e é resumido abaixo:

1. **Contexto no ERP.** Antes de abrir o iframe, o ERP precisa ter um usuário SindicoNet AI selecionado como contexto (tela **Usuários** → botão "Usar"). Esse contexto é um `userId` (Guid) e um `email` de um usuário já existente no SindicoNet AI com `IsAccessConfirmed = true`.

2. **Token do usuário.** Ao navegar para a rota `/sindiconet-ia`, a `sindiconetIaGuard` (`src/app/features/sindiconet-ia/sindiconet-ia.guard.ts`) chama `POST {apiBaseUrl}/api/partner/users/authenticate` enviando `{ userId, email }` no corpo, autenticada como parceiro pelo interceptor. A API responde `{ accessToken, tokenType, expiresIn }` (token válido por 15 minutos), e a guarda salva o token no `SyncStateService`.

3. **Entrega ao iframe.** `SindiconetIaPage` monta `<iframe src={iframeUrl}>`. Ao carregar, o SindicoNet IA envia `sindiconet:embed-ready` à janela pai, e o `SindiconetIframeComponent` responde com `{ type: 'sindiconet:auth-token', token }`. O SindicoNet IA passa a usar esse token como Bearer.

4. **Renovação.** Quando o token vence (a API responde `401`), o SindicoNet IA envia `sindiconet:token-request`; o componente chama o `authenticate` de novo e responde com o token novo.

Em resumo, o ERP gera o token do usuário com `/api/partner/users/authenticate` e o entrega ao `<iframe>` por `postMessage`. Em produção, essa chamada deve sair do backend do ERP: só o `accessToken` do usuário chega ao navegador.

```ts
// src/app/features/sindiconet-ia/sindiconet-ia.guard.ts (essência)
const { accessToken } = await firstValueFrom(auth.authenticate(userId, userEmail));
state.setUserToken(accessToken);
return true;
```

```ts
// resposta ao sindiconet:embed-ready e ao sindiconet:token-request (SindiconetIframeComponent)
iframe.contentWindow.postMessage({ type: 'sindiconet:auth-token', token: accessToken }, new URL(iframeUrl).origin);
```

```html
<!-- src/app/features/sindiconet-ia/sindiconet-ia.page.ts -->
<app-sindiconet-iframe [src]="iframeUrl" [condominiumId]="state.condominiumId()" />
```

Para detalhes completos de payloads, headers e endpoints, consulte a documentação oficial em https://ai-api-sandbox.sindiconet.com.br/docs/?api=partner-integration.

### Sincronizar o condomínio selecionado no ERP

O condomínio ativo no ERP pode ser repassado ao SindicoNet IA, que o seleciona nos dropdowns do chat e dos arquivos do condomínio. O identificador é o `condominiumId` (Guid) retornado pela API Partners. Também é aceito o `externalId` do próprio ERP.

1. **Condomínio inicial:** é enviado na URL do iframe: `{iframeUrl}?condominiumId={condominiumId}` (ou `?condominiumExternalId={externalId}`).
2. **Trocas posteriores:** são enviadas por `postMessage`, sem recarregar o iframe:

   ```ts
   iframe.contentWindow.postMessage(
     { type: 'sindiconet:select-condominium', condominiumId },
     new URL(iframeUrl).origin
   );
   ```

3. **Confirmação:** o SindicoNet IA responde ao ERP com `{ type: 'sindiconet:condominium-selected', condominiumId, success }`. `success: false` indica que o condomínio não existe ou que o usuário não tem acesso a ele.

Na POC, `SindiconetIframeComponent` recebe `[condominiumId]`, faz os dois envios e repassa a confirmação ao menu. Para simular a troca, use o seletor "Condomínio" na seção **Contexto atual** do menu lateral; a confirmação aparece abaixo dele.

## Endpoints utilizados (singulares)

Todas as chamadas a `/api/partner/` passam pelo interceptor `partnerAuthInterceptor`, que adiciona a autenticação do parceiro, inclusive em `/api/partner/users/authenticate`.

| Entidade | Endpoints |
|---|---|
| Auth | `POST /api/partner/users/authenticate` |
| Organizations | `GET/POST /api/partner/organizations` · `GET/PUT/DELETE /api/partner/organizations/{organizationId}` |
| Users | `GET/POST /api/partner/organization/{organizationId}/users` · `GET/PUT/DELETE .../users/{userId}` |
| Condominiums | `GET/POST /api/partner/organization/{organizationId}/condominiums` · `GET/PUT/DELETE .../condominiums/{condominiumId}` |
| Documents | `GET/POST /api/partner/organization/{organizationId}/condominium/{condominiumId}/documents` (multipart, max 200 MB) · `POST .../documents/bulk` · `GET/PUT/DELETE .../documents/{documentId}` |

## Estrutura

```
proxy.conf.json               ← proxy do ng serve para o Keycloak (modo Keycloak)
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
        partner-auth.interceptor.ts     ← Bearer do Keycloak ou X-Client-Id + X-Client-Secret
        partner-token.service.ts        ← token do Keycloak (client_credentials), com cache
        authenticate.service.ts         ← /api/partner/users/authenticate (token do usuário)
        organization.service.ts
        user.service.ts
        condominium.service.ts
        document.service.ts
        sync-state.service.ts           ← Signals compartilhados (org/condo/user/token)
        crud.service.ts                 ← loading/error wrapper + describePartnerError
    shared/
      sindiconet-iframe/sindiconet-iframe.component.ts  ← iframe + postMessage (token e condomínio)
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

- **Iframe abre sem usuário logado.** O token não chegou ao iframe. Confirme que a origem do dev server está liberada no SindicoNet IA e, na aba Network, que `POST /api/partner/users/authenticate` respondeu `200` com o `accessToken`.
- **CORS error no console.** A origem rodando não está na CORS policy `AllowEndpoint` do backend. Use `localhost:3001` (já allowlistada) ou peça ao admin para liberar sua origem. No modo Keycloak, se o erro for na chamada de token, ela não passou pelo proxy: o `tokenUrl` precisa ser o caminho relativo `/auth/realms/...`.
- **401 em `/api/partner/*`.** Credenciais que não batem com o modo configurado (com `tokenUrl`, use o client do Keycloak; sem `tokenUrl`, as credenciais legadas), parceiro inativo ou, no modo Keycloak, client sem vínculo com o parceiro no backend. No modo legado, também acontece quando a origem não está em `sn_PartnerAllowedOrigin`.

## Build de produção

```bash
npm run build
```

Gera `dist/poc-partners/browser/`. **Atenção:** as credenciais do `environment.ts` são empacotadas no bundle JS — em produção real, autentique o parceiro num proxy reverso ou endpoint server-side antes de chegar na API Partners. O build estático não tem o proxy do `ng serve`, então o modo Keycloak só funciona com esse endpoint.
