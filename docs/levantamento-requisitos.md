# Documento de Requisitos — Praia Fácil

**Projeto:** Praia Fácil — plataforma para frequentadores e turistas de praias  
**Versão:** 1.1  
**Data:** 23/11/2026  
**Base do levantamento:** requisitos descritos pelo solicitante como resultado da conversa/reunião com o professor.  
**Observação:** este documento organiza os requisitos informados. Decisões ainda dependentes de validação (pagamentos, anúncios comerciais, política de privacidade e envio de e-mail) estão identificadas como pendências, não como funcionalidades concluídas.

## 1. Objetivo do sistema

O Praia Fácil é uma aplicação web responsiva que reúne informações úteis para pessoas que frequentam praias e turistas. O usuário poderá criar uma conta, consultar estabelecimentos, produtos e serviços próximos, salvar locais de interesse em uma lista de pedidos/roteiro, consultar condições climáticas e gerenciar seu perfil.

## 2. Perfis de usuário

- **Visitante:** pessoa que ainda não entrou no sistema. Pode visualizar a apresentação e acessar cadastro ou login.
- **Cliente cadastrado:** usuário autenticado que consulta locais, salva itens, usa o assistente virtual e atualiza seus dados.
- **Administrador/operador (evolução futura):** responsável por cadastrar anunciantes, moderar conteúdo e administrar categorias. Não faz parte do escopo funcional implementado nesta versão.

## 3. Requisitos funcionais

| ID | Funcionalidade | Especificação / regra |
|---|---|---|
| RF-01 | Tela de abertura | Exibir a identidade visual, logotipo e nome “Praia Fácil” ao iniciar o aplicativo. |
| RF-02 | Boas-vindas | Apresentar saudação contextual (bom dia, boa tarde ou boa noite) e breve descrição do aplicativo. |
| RF-03 | Acesso inicial | Disponibilizar os botões “Novo cadastro” e “Sou cliente”. |
| RF-04 | Cadastro | Solicitar nome, e-mail, telefone com DDD e senha. Validar campos obrigatórios, formato de e-mail, telefone e senha mínima de 8 caracteres. |
| RF-05 | Termos de uso | Exibir os termos e exigir aceite explícito antes de concluir o cadastro. O texto atual é demonstrativo e deverá ser substituído pelo texto aprovado pelo responsável pelo projeto. |
| RF-06 | Cadastro/login social | Disponibilizar autenticação por Google e Facebook quando as credenciais OAuth estiverem configuradas no servidor. |
| RF-07 | Login | Permitir autenticação por e-mail e senha, apresentando mensagem de erro quando as credenciais forem inválidas. |
| RF-08 | Visualização de senha | Disponibilizar controle “olhinho” para alternar entre senha oculta e visível nos campos de senha. |
| RF-09 | Recuperação de senha | Permitir solicitar redefinição por e-mail e cadastrar uma nova senha por meio de token temporário, de uso único e com expiração. |
| RF-10 | Manter login | Disponibilizar opção “Salvar login”. Quando selecionada, manter a sessão no armazenamento persistente do navegador; quando desmarcada, usar sessão temporária. O e-mail pode ser lembrado separadamente. |
| RF-11 | Home personalizada | Exibir saudação e nome do usuário autenticado, resumo do clima, publicidade/área de divulgação, categorias, produtos e serviços. |
| RF-12 | Encerrar sessão | Exibir opção “Sair” e confirmação “Deseja sair do app?”, com as opções “Sim”, “Entrar com outro perfil” e “Cancelar”. |
| RF-13 | Categorias | Permitir filtrar os locais por Todos, Comida, Lojas, Passeios e Esportes. |
| RF-14 | Produtos e serviços | Apresentar estabelecimentos e pontos de interesse classificados em produtos/serviços e suas categorias. |
| RF-15 | Busca | Permitir pesquisar estabelecimentos pelo nome e filtrar por categoria. |
| RF-16 | Publicidade | Exibir espaço de divulgação de empresas relacionadas ao comércio e turismo de praia. Nesta versão, o carrossel utiliza estabelecimentos encontrados na região; anúncios pagos exigem cadastro/contrato com anunciantes e gestão própria. |
| RF-17 | Detalhes de localização | Disponibilizar acesso ao mapa para visualizar a localização do estabelecimento ou ponto de interesse. |
| RF-18 | Pedidos/lista de interesse | Permitir adicionar locais à lista do usuário, consultar a lista e remover itens. Nesta versão, “pedido” representa local salvo/roteiro de interesse, não uma compra confirmada. |
| RF-19 | Navegação principal | Disponibilizar navegação por Pedidos, Buscar, Início e Perfil. |
| RF-20 | Perfil | Exibir e permitir alterar nome, e-mail e telefone, com validação e confirmação de atualização. |
| RF-21 | Alteração de senha | Permitir redefinir a senha dentro do perfil, solicitando a senha atual quando a conta possuir senha local. |
| RF-22 | Assistente virtual | Disponibilizar acesso ao assistente virtual a partir da home e do perfil. |
| RF-23 | Condições climáticas | Consultar e exibir informações meteorológicas do dia para a localização configurada: temperatura atual, sensação térmica, máxima, mínima, descrição do tempo, probabilidade de chuva, índice UV, vento, umidade e pôr do sol quando disponível. |
| RF-24 | Orientação climática | Permitir perguntas rápidas ao assistente sobre chuva, UV, vento e condições para ir à praia. Informar limitações quando dados como maré não estiverem integrados. |
| RF-25 | Persistência | Armazenar contas, credenciais protegidas, tokens de redefinição e locais salvos em banco de dados, associados ao usuário correto. |
| RF-26 | Catálogo de Boa Viagem | Combinar pontos de interesse do OpenStreetMap com um catálogo inicial de restaurantes e quiosques de referência do bairro, evitando duplicidades por nome/endereço. |
| RF-27 | Assistente com IA | Receber perguntas em linguagem natural sobre assuntos gerais, turismo, estabelecimentos e clima, mantendo o contexto recente da conversa. A integração depende de chave OpenAI configurada no servidor. |
| RF-28 | Respostas com pesquisa | Permitir que o assistente use pesquisa na web para perguntas que exijam informação atualizada, identificando incertezas e evitando inventar horários, preços ou disponibilidade. |
| RF-29 | Login social configurável | Iniciar os fluxos OAuth de Google e Facebook e concluir a autenticação quando IDs, segredos e URLs de callback válidos estiverem configurados nos respectivos painéis. |
| RF-30 | Login social simulado | Em modo de demonstração local, exibir uma tela explicitamente identificada como simulação e autenticar a conta de teste `teste01@gmail.com`, sem acessar serviços externos. |
| RF-31 | Conta de demonstração | Criar/atualizar automaticamente a conta local `teste01@gmail.com` em modo de demonstração; permitir cadastrar `teste02@gmail.com` pelo formulário usando senha de 7 caracteres apenas nesse modo. |

## 4. Requisitos não funcionais

| ID | Categoria | Especificação |
|---|---|---|
| RNF-01 | Usabilidade | Interface em português do Brasil, com textos objetivos, botões identificáveis e fluxo simples para cadastro, login e navegação. |
| RNF-02 | Responsividade | Adaptar a interface a celulares, tablets e computadores, priorizando uso móvel por frequentadores da praia. |
| RNF-03 | Desempenho | Apresentar telas locais sem atrasos desnecessários; informar carregamento e permitir tentar novamente quando uma consulta externa falhar. |
| RNF-04 | Segurança | Armazenar senhas com hash seguro (bcrypt), nunca em texto puro. |
| RNF-05 | Segurança de sessão | Proteger rotas privadas por autenticação, utilizar tokens com expiração e permitir encerramento da sessão. |
| RNF-06 | Segurança contra abuso | Aplicar limitação de tentativas em operações sensíveis, como login, cadastro e recuperação de senha. |
| RNF-07 | Privacidade/LGPD | Coletar apenas dados necessários, informar finalidade de uso e disponibilizar política de privacidade e canal de contato antes da publicação. |
| RNF-08 | Integridade | Impedir duplicidade de e-mail e de local salvo para o mesmo usuário; validar dados no servidor, não apenas na interface. |
| RNF-09 | Disponibilidade externa | Tratar indisponibilidade de serviços de clima, mapas e autenticação social com mensagens claras, sem travar o restante do aplicativo. |
| RNF-10 | Manutenibilidade | Separar interface, API, configuração e persistência; documentar variáveis de ambiente e passos de instalação. |
| RNF-11 | Compatibilidade | Funcionar em navegadores modernos com suporte a JavaScript, armazenamento local e requisições HTTPS. |
| RNF-12 | Acessibilidade | Utilizar rótulos nos campos, foco visível, botões com nomes compreensíveis e contraste adequado. |
| RNF-13 | Configurabilidade | Permitir alterar praia de referência, coordenadas e raio de busca por variáveis de ambiente, sem alterar o código-fonte. |
| RNF-14 | Segurança de implantação | Em produção, operar com HTTPS, segredo JWT forte e credenciais de provedores mantidas fora do repositório. |

## 5. Especificação dos principais fluxos

### 5.1 Primeiro acesso e cadastro
1. O sistema apresenta a tela de abertura com logo e nome Praia Fácil.
2. Em seguida, apresenta a tela de boas-vindas e os botões “Novo cadastro” e “Sou cliente”.
3. Ao escolher “Novo cadastro”, o visitante informa nome, e-mail, telefone e senha.
4. O visitante consulta e aceita os Termos de Uso.
5. O sistema valida os dados, verifica se o e-mail já está cadastrado e cria a conta.
6. Após o cadastro, o usuário é autenticado e direcionado à home.

### 5.2 Login e recuperação de senha
1. O cliente informa e-mail e senha.
2. Pode usar o olhinho para conferir a senha digitada.
3. Pode marcar “Salvar login”.
4. Se esquecer a senha, informa seu e-mail e solicita o link de redefinição.
5. O sistema gera token temporário e permite cadastrar uma nova senha.
6. O envio efetivo do link por e-mail depende da configuração de um serviço SMTP/provedor de e-mail. No modo de desenvolvimento, o link pode ser exibido para teste.

### 5.3 Home e navegação
1. A home apresenta o nome do usuário e opção “Sair”.
2. Exibe o resumo meteorológico e acesso ao assistente.
3. Exibe área de publicidade e categorias.
4. Lista produtos e serviços obtidos a partir da fonte de locais configurada.
5. A barra inferior permite acessar Pedidos, Buscar, Início e Perfil.
6. Ao sair, o usuário escolhe confirmar, entrar com outro perfil ou cancelar.

### 5.4 Busca e pedidos
1. O usuário abre “Buscar”, digita o nome de um local e/ou seleciona uma categoria.
2. O sistema apresenta resultados e opção de abrir o local no mapa.
3. O usuário pode adicionar o local à lista “Pedidos”.
4. Em “Pedidos”, pode consultar e remover locais salvos.
5. A lista não representa transação financeira, reserva ou pedido comercial confirmado.

### 5.5 Perfil e assistente
1. O usuário abre o assistente e envia perguntas gerais em linguagem natural.
2. O sistema encaminha a conversa à IA configurada, com contexto de clima e catálogo de Boa Viagem quando disponível.
3. O assistente informa quando não possui dados atualizados e evita afirmar maré/balneabilidade sem fonte integrada.
4. O usuário abre “Perfil” e altera nome, e-mail ou telefone.
2. O sistema valida e salva os dados.
3. O usuário pode acessar a redefinição de senha.
4. O assistente exibe o clima e responde a perguntas pré-definidas sobre as condições meteorológicas disponíveis.

## 6. Regras de negócio

- RN-01: o e-mail deve ser único por conta.
- RN-02: a senha local deve possuir no mínimo 8 caracteres.
- RN-03: o aceite dos Termos de Uso é obrigatório para cadastro por e-mail e senha.
- RN-04: cada usuário só pode consultar, adicionar ou remover seus próprios locais salvos.
- RN-05: o token de redefinição expira em 1 hora e não pode ser reutilizado.
- RN-06: os dados meteorológicos correspondem à praia/localização configurada no servidor, não necessariamente à localização GPS individual do usuário.
- RN-07: a lista “Pedidos” é uma lista de locais de interesse/roteiro. Pagamentos, reservas e compras não estão incluídos nesta versão.
- RN-08: a publicidade atual é demonstrativa/dinâmica com locais encontrados; não há cobrança ou gestão de campanhas nesta versão.

## 7. Critérios de aceite

- CA-01: visitante consegue abrir cadastro e criar conta com dados válidos e aceite dos termos.
- CA-02: cadastro é recusado se houver campo obrigatório inválido, senha menor que 8 caracteres ou termos não aceitos.
- CA-03: cliente consegue entrar com credenciais válidas e recebe erro para credenciais inválidas.
- CA-04: o controle de senha alterna entre visível e oculta.
- CA-05: “Salvar login” mantém a sessão após fechar/reabrir o navegador; sem a opção, a sessão é temporária.
- CA-06: recuperação de senha aceita token válido e recusa token expirado ou já utilizado.
- CA-07: home apresenta nome do usuário, categorias, locais, clima e navegação principal.
- CA-08: busca filtra os locais por nome e categoria.
- CA-09: usuário adiciona e remove locais da sua lista, e os dados permanecem associados à sua conta.
- CA-10: perfil atualiza nome, e-mail e telefone, respeitando a unicidade do e-mail.
- CA-11: usuário consegue alterar a senha e encerrar a sessão.
- CA-12: falhas de APIs externas exibem mensagem e opção de tentar novamente.
- CA-13: assistente responde às perguntas meteorológicas cobertas e informa quando um dado não está disponível.

## 8. Limites, dependências e pendências

| Item | Situação nesta versão | Necessário para produção |
|---|---|---|
| Google/Facebook | Fluxos OAuth implementados no servidor | Criar aplicações, configurar IDs/segredos, URLs de callback e publicar/revisar os apps |
| Assistente com IA | Endpoint integrado à Responses API | Criar chave de API, configurar `OPENAI_API_KEY` e acompanhar custos/limites de uso |
| Recuperação por e-mail | Token gerado; link aparece no log/modo desenvolvimento | Integrar SMTP ou serviço transacional, configurar domínio e modelos de e-mail |
| Clima | Consulta via Open-Meteo | Monitorar limites/disponibilidade e validar a praia configurada |
| Locais e mapas | OpenStreetMap/Overpass; Google Places opcional | Revisar atribuições, termos de uso, limites e qualidade dos dados |
| Publicidade | Carrossel de estabelecimentos locais | Painel de anunciantes, campanhas, contratos e identificação de conteúdo patrocinado |
| Compras/pagamentos | Não implementados | Definir parceiros, catálogo, estoque, pedidos, pagamentos, cancelamento e suporte |
| Marés | Não fornecidas em tempo real pelo assistente atual | Integrar fonte oficial confiável, com porto e horário de referência |
| Termos e privacidade | Texto de exemplo | Revisão e aprovação jurídica/administrativa |
| Administração | Fora do escopo | Definir perfil administrativo e painel de gestão, se necessário |

## 9. Roteiro mínimo de testes

| Teste | Ação | Resultado esperado |
|---|---|---|
| CT-01 | Abrir o aplicativo | Tela de abertura e boas-vindas são apresentadas |
| CT-02 | Tentar cadastrar sem aceitar termos | Cadastro bloqueado com orientação |
| CT-03 | Cadastrar com e-mail já existente | Sistema informa que a conta já existe e oferece login |
| CT-04 | Entrar com senha incorreta | Acesso negado com mensagem clara |
| CT-05 | Acionar o olhinho | Senha alterna entre oculta e visível |
| CT-06 | Solicitar recuperação de senha | Sistema confirma solicitação sem revelar se o e-mail existe |
| CT-07 | Adicionar local aos pedidos | Local aparece na lista após atualização |
| CT-08 | Remover local | Local deixa de aparecer na lista |
| CT-09 | Atualizar dados do perfil | Dados atualizados são exibidos na sessão |
| CT-10 | Sair e entrar com outro perfil | Sessão anterior é encerrada e tela de login fica disponível |
| CT-11 | Desconectar serviço de clima/locais | Aplicativo informa indisponibilidade sem encerrar a sessão |
| CT-12 | Usar assistente com pergunta sobre chuva/UV/vento | Resposta usa os dados meteorológicos carregados |

## 10. Glossário

- **Home:** tela principal após autenticação.
- **OAuth:** padrão de autorização usado para login por provedores externos.
- **Token:** credencial temporária usada para autenticar uma sessão ou redefinir senha.
- **API:** interface de comunicação entre o aplicativo e serviços externos/servidor.
- **Overpass/OpenStreetMap:** fonte de dados geográficos e pontos de interesse.
- **Open-Meteo:** serviço externo utilizado para dados meteorológicos.


**Nota de demonstração:** os botões Google/Facebook funcionam por simulação local quando `DEMO_MODE=true`. Eles não autenticam uma conta Google ou Facebook real; essa distinção deve ser explicada durante a apresentação.
