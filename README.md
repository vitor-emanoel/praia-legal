# Praia Fácil

Aplicação web responsiva para frequentadores e turistas de praias. Reúne cadastro e autenticação, descoberta de comércio e serviços próximos, lista de locais de interesse, perfil do usuário e consulta ao clima.

## Funcionalidades

- Tela de abertura e boas-vindas.
- Cadastro com nome, e-mail, telefone, senha e aceite dos termos.
- Login por e-mail/senha, visualização de senha e opção de salvar sessão.
- Fluxo de recuperação e redefinição de senha.
- Modo demonstração local: botões Google/Facebook abrem uma tela simulada e autenticam a conta de teste, sem acessar provedores reais.
- Login social real Google/Facebook via OAuth 2.0, quando `DEMO_MODE=false` e as credenciais dos provedores estiverem configuradas.
- Home com saudação, clima, categorias, produtos/serviços e área de divulgação.
- Busca por nome e categoria.
- Lista pessoal de locais salvos (“Pedidos”).
- Perfil com atualização de nome, e-mail e telefone e alteração de senha.
- Assistente virtual integrado à OpenAI Responses API para perguntas gerais, com contexto de clima e locais de Boa Viagem (requer chave de API).
- Dados meteorológicos via Open-Meteo e locais via OpenStreetMap/Overpass; Google Places opcional.

## Tecnologias

- Front-end: React 18 via CDN e Babel Standalone.
- Back-end: Node.js, Express.
- Banco de dados: SQLite nativo do Node.js (`node:sqlite`), sem módulo nativo externo.
- Autenticação: JWT e bcrypt.
- Integrações: Open-Meteo, OpenStreetMap/Overpass, OpenAI Responses API e OAuth Google/Facebook opcional.

## Requisitos

- Node.js 24 LTS ou superior.
- npm.
- Conexão com a internet para consultar clima, locais e bibliotecas carregadas via CDN.

## Reinstalar após atualizar para esta versão

Se você já tentou instalar a versão anterior, apague a pasta `node_modules` e o arquivo `package-lock.json` antigos antes de instalar. No terminal CMD, dentro da pasta `praia-facil`, execute:

```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

Se algum desses itens não existir, o Windows pode avisar; basta continuar. Esta versão remove `better-sqlite3`, que exigia compilação nativa no Windows, e usa o SQLite incluído no próprio Node.js 24.

## Executar localmente (Windows)

1. Extraia o ZIP e abra a pasta `praia-facil` no terminal.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Copie `.env.example` para `.env`.
4. No `.env`, defina `JWT_SECRET` com uma frase aleatória longa (mínimo de 16 caracteres; recomendado 32 ou mais).
5. Inicie:

   ```bash
   npm start
   ```

6. Acesse `http://localhost:3000`.

O banco SQLite `praia.db` será criado automaticamente na primeira execução. O projeto usa o módulo `node:sqlite` incluído no Node.js 24, evitando compilação de bibliotecas C++ e instalação do Visual Studio Build Tools.

## Configuração da praia

As variáveis `BEACH_NAME`, `BEACH_LAT`, `BEACH_LON` e `BEACH_RADIUS` definem a praia de referência e o raio de busca. Os valores de exemplo apontam para Boa Viagem, Recife. A consulta meteorológica usa essas coordenadas; não representa automaticamente a localização GPS de cada usuário.

## Login Google e Facebook

O fluxo está implementado, mas exige credenciais próprias. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FB_APP_ID` e `FB_APP_SECRET` no `.env` e cadastre exatamente as URLs de callback correspondentes ao domínio usado. Sem essas credenciais, os botões sociais informam que o recurso não está configurado.

## Limitações conhecidas — leia antes de apresentar como produto final

- A recuperação de senha gera token e registra o link no console do servidor; no modo de desenvolvimento ele também é mostrado na interface. Para produção, integrar envio real de e-mail (SMTP/provedor transacional).
- O texto de Termos de Uso é provisório. Criar Termos e Política de Privacidade aprovados antes de publicar.
- O carrossel da home apresenta locais encontrados na região; ainda não existe painel nem campanha de publicidade paga.
- “Pedidos” é uma lista de locais salvos/roteiro de interesse, não um sistema de compra, reserva ou pagamento.
- O assistente responde sobre dados meteorológicos disponíveis. Marés e condições do mar não estão integradas.
- A disponibilidade e precisão dos locais dependem da base externa e da praia configurada.

## Documentação acadêmica

O levantamento dos requisitos funcionais e não funcionais, fluxos, regras de negócio, critérios de aceite e roteiro de testes está em [`docs/levantamento-requisitos.md`](docs/levantamento-requisitos.md). O documento foi organizado a partir dos requisitos informados e deve ser validado com o professor/equipe.

## Segurança antes de publicar

- Nunca envie `.env`, tokens ou segredos para o GitHub.
- Use HTTPS e `NODE_ENV=production`.
- Defina um `JWT_SECRET` forte e exclusivo.
- Configure envio de e-mail e URLs de callback do domínio de produção.
- Revise Termos de Uso, Política de Privacidade e tratamento de dados conforme a LGPD.
- Revise atribuição e condições de uso das fontes externas.


## Assistente virtual com IA

Para habilitar respostas a perguntas gerais, crie uma chave no painel da OpenAI e adicione ao `.env`:

```env
OPENAI_API_KEY=sua_chave_secreta
OPENAI_MODEL=gpt-6.2-astra
```

Reinicie o servidor com `npm start`. A chave fica somente no servidor e nunca deve ser colocada no React/navegador. O assistente usa a Responses API e pesquisa na web quando necessário. O uso da API pode gerar cobrança separada da assinatura do ChatGPT; consulte sua conta e limites antes de usar.

Sem a chave, o app continua com clima e catálogo de locais, mas o chat de perguntas gerais informa que precisa ser configurado.

## Catálogo de Boa Viagem

A busca combina resultados do OpenStreetMap com uma lista inicial de referência de restaurantes e quiosques conhecidos no bairro, como Entre Amigos Praia, Bode do Nô, Bar do Cuscuz, Parraxaxá, Chica Pitanga, Ilha dos Navegantes, Cia do Chopp, Quiosque 44, Quiosque 13 e Tapiocas da Sé. O catálogo não é exaustivo; confirme endereço, horário e funcionamento antes de visitar. Os dados de locais externos podem variar.


## Modo de demonstração local — Google e Facebook

Por padrão, em execução local fora de produção, o modo de demonstração é ativado automaticamente. Os botões Google e Facebook redirecionam para uma tela claramente identificada como simulação (não é uma página oficial desses provedores). Ao continuar, a aplicação autentica a conta local `teste01@gmail.com`.

**Conta de demonstração pré-criada:**
- E-mail: `teste01@gmail.com`
- Senha: `teste01`
- A conta é inserida/atualizada no banco local na inicialização quando o modo de demonstração está ativo.

**Teste do cadastro:**
- Crie normalmente uma conta pelo formulário com `teste02@gmail.com`.
- Use a senha `teste02` (7 caracteres, aceita somente no modo de demonstração).
- Informe nome e telefone e marque o aceite dos termos.
- O cadastro `teste02` é persistido como uma conta local comum; não é uma conta Google/Gmail real.

O modo de demonstração não coleta nem verifica senhas do Google ou Facebook. Não use essas credenciais em produção. Para desativar a simulação e ativar OAuth real, configure `DEMO_MODE=false`, configure os Client IDs/Secrets válidos e os callbacks descritos nas seções seguintes.

## Configurar login Google

1. Acesse Google Cloud Console e crie/seleciona um projeto.
2. Configure a tela de consentimento OAuth e crie um ID de cliente do tipo Aplicativo da Web.
3. Em "Origens JavaScript autorizadas", adicione `http://localhost:3000`.
4. Em "URIs de redirecionamento autorizados", adicione `http://localhost:3000/auth/google/callback`.
5. Copie o ID e o segredo para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`.

## Configurar login Facebook

1. Registre-se no Meta for Developers e crie um aplicativo com o produto Facebook Login para Web.
2. Configure o domínio do app e a URL de redirecionamento OAuth válida: `http://localhost:3000/auth/facebook/callback`.
3. Copie o ID e o segredo do aplicativo para `FB_APP_ID` e `FB_APP_SECRET` no `.env`.
4. Para testes, adicione os usuários/contas como testadores ou administradores do aplicativo. Para disponibilizar publicamente, conclua as etapas de publicação e análise exigidas pela Meta.

Os botões sociais já iniciam os fluxos OAuth do servidor, mas não conseguem autenticar até que as credenciais reais sejam cadastradas nos respectivos painéis. Nunca compartilhe os segredos nem publique o `.env`.
