// Copie este arquivo para `environment.ts` e preencha com as credenciais
// fornecidas pelo time do SindicoNet AI. NUNCA commite credenciais reais.
//
// Em sandbox, solicite clientId/clientSecret ao admin. Em produção, troque
// o exemplo de fetch client-side por um proxy reverso ou endpoint server-side
// que adicione X-Client-Id / X-Client-Secret sem expor o secret no bundle.

export const environment = {
  production: false,
  partner: {
    apiBaseUrl: 'https://ai-api-sandbox.sindiconet.com.br',
    clientId: '<SEU_CLIENT_ID>',
    clientSecret: '<SEU_CLIENT_SECRET>',
    iframeUrl: 'https://sandbox.sindiconet.com.br/ia/'
  }
};
