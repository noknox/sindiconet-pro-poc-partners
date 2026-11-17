// Copie este arquivo para `environment.ts` e preencha com as credenciais
// fornecidas pelo time do SindicoNet AI. NUNCA commite credenciais reais.
//
// Em sandbox, solicite clientId/clientSecret ao admin. Em produção, troque
// o exemplo de fetch client-side por um proxy reverso ou endpoint server-side
// que obtenha o token (ou adicione X-Client-Id / X-Client-Secret) sem expor o secret no bundle.
//
// Com tokenUrl, clientId/clientSecret são do client no Keycloak e a API recebe Authorization: Bearer.
// O caminho relativo passa pelo proxy do `ng serve` (proxy.conf.json), porque o Keycloak não libera CORS.
// Sem tokenUrl, clientId/clientSecret são os legados, enviados em X-Client-Id / X-Client-Secret.

export const environment = {
  production: false,
  partner: {
    apiBaseUrl: 'https://ai-api-sandbox.sindiconet.com.br',
    clientId: '<SEU_CLIENT_ID>',
    clientSecret: '<SEU_CLIENT_SECRET>',
    tokenUrl: '/auth/realms/sindiconet.parceiros/protocol/openid-connect/token',
    iframeUrl: 'https://sandbox.sindiconet.com.br/ia/'
  }
};
