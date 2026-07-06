'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#FAF9FF] relative overflow-hidden select-none">
      {/* Decorative soft blur shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none bg-[#7c3aed]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none bg-[#c084fc]" />

      {/* Header / Navigation */}
      <header className="border-b border-zinc-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-650 hover:text-zinc-900 transition-colors text-xs font-bold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a Home</span>
          </Link>
          <BrandLogo iconSize="sm" textSize="sm" forceTheme="light" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header Title Card */}
          <div className="bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] rounded-[32px] p-8 md:p-12 text-white shadow-[0_20px_50px_rgba(124,58,237,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-white/20 text-white w-max block">
                Privacidade &amp; LGPD
              </span>
              <h1 className="text-2xl md:text-3xl font-outfit font-extrabold tracking-tight">
                Política de Privacidade
              </h1>
              <p className="text-white/80 text-xs font-medium">
                Última atualização: 11 de Junho de 2026
              </p>
            </div>
            <Shield className="h-16 w-16 text-white/20 shrink-0 hidden md:block" />
          </div>

          {/* Content Card */}
          <div className="bg-white border border-zinc-200/60 rounded-[32px] p-8 md:p-12 shadow-[0_24px_70px_rgba(124,58,237,0.02)] space-y-8 text-zinc-700 text-xs md:text-sm leading-relaxed font-sans">
            <p className="font-semibold text-zinc-800">
              Esta Política de Privacidade visa esclarecer de forma transparente como a plataforma <strong className="text-[#7c3aed]">Venusta</strong> (doravante denominada "<strong>Plataforma</strong>" ou "<strong>Nós</strong>"), operada pela <strong>VTRX SOLUTIONS TECNOLOGIA DA INFORMACAO LTDA</strong>, inscrita no CNPJ/ME sob o nº <strong>66.940.624/0001-05</strong>, com sede na Lote Avenida Regimento, nº 2601, Vila do Bec, Timon - MA, CEP: 65.632-160 ("<strong>Licenciante</strong>"), coleta, utiliza, armazena e protege os dados pessoais coletados no decorrer do uso do nosso software de gestão.
            </p>
            <p className="font-medium">
              Esta política se aplica a:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-zinc-650">
              <li><strong>Licenciados / Parceiros (B2B)</strong>: Proprietários de estabelecimentos de beleza e administradores que assinam a nossa plataforma.</li>
              <li><strong>Profissionais do Estabelecimento</strong>: Cabeleireiros, barbeiros, manicures e demais prestadores vinculados às contas dos estabelecimentos licenciados.</li>
              <li><strong>Clientes Finais (B2C)</strong>: Consumidores finais que utilizam os subdomínios, catálogos públicos ou assistentes virtuais de agendamento no WhatsApp dos estabelecimentos parceiros.</li>
            </ol>

            <hr className="border-zinc-100" />

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">1. Definições Gerais perante a LGPD (Lei nº 13.709/2018)</h2>
              <p>Para os fins desta política, entende-se por:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
                <li><strong>Dado Pessoal</strong>: Qualquer informação relacionada a pessoa natural identificada ou identificável.</li>
                <li><strong>Titular</strong>: A pessoa física a quem se referem os dados pessoais (Clientes Finais, Profissionais e Licenciados).</li>
                <li><strong>Controlador</strong>: A pessoa jurídica a quem competem as decisões sobre o tratamento de dados. Neste caso, <strong>o Estabelecimento Licenciado é o Controlador</strong> dos dados de seus profissionais e clientes finais.</li>
                <li><strong>Operador</strong>: A pessoa jurídica que realiza o tratamento de dados pessoais em nome do Controlador. Neste caso, <strong>a Plataforma Venusta atua como Operadora</strong> dos dados de clientes finais e profissionais do estabelecimento.</li>
                <li><strong>Tratamento</strong>: Toda operação realizada com dados pessoais (como coleta, registro, armazenamento, consulta, compartilhamento e eliminação).</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">2. Dados Pessoais Coletados e Finalidade</h2>
              
              <h3 className="font-bold text-zinc-800">2.1. Dados dos Licenciados (Administradores do Salão)</h3>
              <p>Coletados no cadastro inicial do estabelecimento:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-650">
                <li><strong>Dados cadastrais</strong>: Nome completo do administrador, razão social, CNPJ (ou CPF), telefone de contato e endereço de e-mail.</li>
                <li><strong>Dados de faturamento</strong>: Dados do cartão de crédito ou dados bancários para processamento de pagamentos da mensalidade (armazenados diretamente no gateway de pagamentos parceiro sob regras de segurança PCI-DSS).</li>
                <li><strong>Finalidade</strong>: Gerenciar a conta do Licenciado, prestar suporte técnico, emitir cobranças e notas fiscais, e aplicar as configurações de branding e customização de cores/logos.</li>
              </ul>

              <h3 className="font-bold text-zinc-800">2.2. Dados dos Profissionais (Equipe do Salão)</h3>
              <p>Coletados pelo Licenciado para configuração da agenda de atendimento:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-650">
                <li><strong>Dados cadastrais</strong>: Nome completo, especialidade/função, e-mail, número de celular (WhatsApp) e foto de perfil (opcional).</li>
                <li><strong>Dados operacionais</strong>: Horário de trabalho, comissões de serviço cadastradas e agenda de compromissos.</li>
                <li><strong>Finalidade</strong>: Permitir a alocação de agendamentos no profissional selecionado, calcular comissões financeiras de serviços prestados e notificar o profissional sobre novos atendimentos.</li>
              </ul>

              <h3 className="font-bold text-zinc-800">2.3. Dados dos Clientes Finais (Consumidores do Salão)</h3>
              <p>Coletados no catálogo de agendamentos online, no chatbot de WhatsApp ou diretamente no painel interno pelo Licenciado:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-650">
                <li><strong>Dados básicos</strong>: Nome completo, e-mail, telefone de contato (celular com WhatsApp).</li>
                <li><strong>Dados de agendamento</strong>: Data, hora, tipo de serviço contratado, profissional responsável e preço combinado.</li>
                <li><strong>Histórico de visitas e avaliações</strong>: Feedback de ratings pós-atendimento e observações internas cadastradas pelo salão (ex: restrições a produtos químicos, cor de tintura habitual).</li>
                <li><strong>Finalidade</strong>: Efetivar e confirmar agendamentos comerciais na agenda do salão, enviar mensagens de lembretes automáticos e exibir histórico para personalização do atendimento pelo profissional.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">3. Compartilhamento de Dados com Terceiros</h2>
              <p>
                A Plataforma Venusta <strong>não vende, aluga ou cede</strong> quaisquer dados pessoais tratados em nossos servidores para terceiros em benefício comercial próprio. O compartilhamento ocorre estritamente para viabilizar as funcionalidades da ferramenta, limitado aos seguintes parceiros homologados:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
                <li><strong>Gateways de Pagamento (ex: Stripe, Asaas ou PagSeguro)</strong>: Dados de cartão de crédito e identificação de pagamento são criptografados e transmitidos diretamente a estas instituições financeiras para processamento da assinatura do Licenciado ou das transações de clientes.</li>
                <li><strong>APIs de Comunicação (WhatsApp/SMS)</strong>: Os números de telefone e os dados da mensagem de lembrete (nome, data, salão) são processados e enviados por meio de servidores integradores para entrega no aplicativo WhatsApp do cliente final.</li>
                <li><strong>Provedores de Hospedagem em Nuvem (Cloud Hosting)</strong>: Os dados de banco de dados e arquivos de mídia são armazenados em infraestrutura de nuvem segura no Brasil ou no exterior (seguindo padrões internacionais de transferência segura de dados).</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">4. Diretrizes para Comunicações Promocionais e E-mail Marketing (Anti-Spam)</h2>
              <p>
                Tanto a Plataforma Venusta (ao enviar comunicações sobre o sistema) quanto os estabelecimentos Licenciados (ao utilizarem as ferramentas de envio integradas) comprometem-se a respeitar as seguintes diretrizes para o envio de e-mails promocionais e de e-mail marketing:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
                <li><strong>Identificação do Remetente</strong>: O remetente do e-mail deve ser claramente identificável, sendo vedada a utilização de cabeçalhos falsos ou enganosos.</li>
                <li><strong>Inclusão do Endereço Físico</strong>: Toda peça de e-mail marketing enviada deverá conter, obrigatoriamente, o <strong>endereço físico oficial do remetente</strong> no rodapé (seja o endereço oficial da <strong>VTRX SOLUTIONS TECNOLOGIA DA INFORMACAO LTDA</strong> ou o endereço do estabelecimento parceiro correspondente).</li>
                <li><strong>Link de Descadastro (Opt-out) Claro e Visível</strong>: Todos os e-mails promocionais deverão apresentar, no rodapé da mensagem, um <strong>link funcional, claro e de fácil identificação para descadastro instantâneo</strong> da lista de envios.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">5. Responsabilidade e Remoção de Dados por Inadequação de Conteúdo</h2>
              <p>
                5.1. A Plataforma Venusta atua como intermediadora de hospedagem de mídias e cadastros. Caso o Licenciado realize o upload de logotipos, imagens de perfil ou insira textos que violem a privacidade de terceiros, direitos autorais de marcas ou a legislação em vigor, a Licenciante reserva-se o direito de remover sumariamente tais arquivos de seus servidores e bancos de dados de forma imediata.
              </p>
              <p>
                5.2. O Titular de dados que constatar que seus dados pessoais ou imagem de direitos proprietários foram inseridos de forma não autorizada em qualquer página da Plataforma poderá solicitar a remoção imediata enviando a notificação fundamentada com comprovação de identidade para o e-mail de suporte.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">6. Segurança da Informação</h2>
              <p>
                Implementamos medidas técnicas e administrativas robustas para proteger seus dados contra acessos não autorizados, vazamentos, destruição ou alteração ilícita:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
                <li><strong>Comunicação Segura</strong>: Todo o tráfego de dados entre o navegador (ou app) e os nossos servidores é criptografado usando o protocolo HTTPS com chaves de segurança SSL/TLS.</li>
                <li><strong>Bancos de Dados Isolados por Inquilino (Multi-tenant Security)</strong>: Aplicação de filtros rigorosos a nível de banco de dados para assegurar que nenhum estabelecimento consiga acessar ou ler dados de clientes pertencentes a outro subdomínio parceiro.</li>
                <li><strong>Controle de Acessos</strong>: Sistemas com regras rígidas de permissão de papéis de usuários (Administradores, Profissionais, Clientes Finais), impedindo o acesso indevido a dados de faturamento e relatórios financeiros.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">7. Período de Retenção de Dados e Cancelamento</h2>
              <p>
                7.1. Os dados de clientes finais e profissionais vinculados a um salão parceiro serão mantidos armazenados enquanto a conta do Licenciado estiver ativa e adimplente.
              </p>
              <p>
                7.2. Quando houver o cancelamento da assinatura pelo Licenciado, a Plataforma Venusta manterá os dados em servidores inativos por até <strong>90 (noventa) dias</strong> para garantir uma eventual reativação sem perda de histórico. Decorrido este prazo, realizaremos a exclusão permanente dos dados ou a anonimização irreversível das informações.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">8. Direitos dos Titulares (Como Exercê-los)</h2>
              <p>
                A LGPD assegura direitos específicos para pessoas físicas em relação aos seus dados pessoais. O Titular possui o direito de solicitar a qualquer tempo:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-zinc-650">
                <li>Confirmação da existência de tratamento dos dados.</li>
                <li>Acesso facilitado aos seus dados armazenados.</li>
                <li>Correção de dados pessoais incompletos, inexatos ou desatualizados.</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
                <li>Eliminação dos dados pessoais tratados com base no seu consentimento.</li>
              </ol>
              <p>
                <strong>Como exercer:</strong> Como a Plataforma Venusta atua primariamente na condição de <strong>Operadora</strong>, qualquer solicitação de exclusão ou alteração de dados de Clientes Finais recebida diretamente por Nós será informada ao Estabelecimento Licenciado (<strong>Controlador</strong>), para que este valide e autorize a exclusão em sua conta. Contato oficial via: <strong>vtrxsolutions@gmail.com</strong>.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">9. Contato do Encarregado de Proteção de Dados (DPO) e Canal Oficial</h2>
              <p>
                Para exercer os direitos garantidos pela LGPD ou obter esclarecimentos adicionais, entre em contato com o nosso Encarregado de Proteção de Dados (DPO):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-650">
                <li><strong>E-mail do Encarregado (DPO)</strong>: <strong>vtrxsolutions@gmail.com</strong></li>
                <li><strong>Endereço Físico</strong>:
                  <div className="mt-1 pl-4 border-l-2 border-zinc-200 text-zinc-500 font-medium">
                    VTRX SOLUTIONS TECNOLOGIA DA INFORMACAO LTDA<br />
                    Lote Avenida Regimento, nº 2601, Vila do Bec<br />
                    Timon - MA, CEP: 65.632-160
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Simple Footer */}
      <footer className="text-center py-8 text-zinc-400 text-[10px] tracking-wider uppercase border-t border-zinc-200 bg-white">
        &copy; {new Date().getFullYear()} Venusta. Todos os direitos reservados.
      </footer>
    </div>
  );
}
