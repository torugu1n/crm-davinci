'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function TermosDeUsoPage() {
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
                Documento Legal
              </span>
              <h1 className="text-2xl md:text-3xl font-outfit font-extrabold tracking-tight">
                Termos de Uso
              </h1>
              <p className="text-white/80 text-xs font-medium">
                Última atualização: 11 de Junho de 2026
              </p>
            </div>
            <FileText className="h-16 w-16 text-white/20 shrink-0 hidden md:block" />
          </div>

          {/* Content Card */}
          <div className="bg-white border border-zinc-200/60 rounded-[32px] p-8 md:p-12 shadow-[0_24px_70px_rgba(124,58,237,0.02)] space-y-8 text-zinc-700 text-xs md:text-sm leading-relaxed font-sans">
            <p className="font-semibold text-zinc-800">
              Seja bem-vindo à plataforma <strong className="text-[#7c3aed]">Venusta</strong>, um software de gestão inteligente e agenda digital para estabelecimentos de beleza, bem-estar e estética, disponibilizado sob o modelo de Licenciamento de Software como Serviço (SaaS - <em>Software as a Service</em>).
            </p>
            <p>
              Estes Termos de Uso regem o acesso e a utilização da plataforma <strong>Venusta</strong> (composta pelo portal principal, sistemas em subdomínios de parceiros, catálogo de agendamentos e integrações), desenvolvida e operada pela <strong>VTRX SOLUTIONS TECNOLOGIA DA INFORMACAO LTDA</strong>, inscrita no CNPJ/ME sob o nº <strong>66.940.624/0001-05</strong>, com sede na Lote Avenida Regimento, nº 2601, Vila do Bec, Timon - MA, CEP: 65.632-160 (doravante denominada simplesmente "<strong>Licenciante</strong>" ou "<strong>Nós</strong>").
            </p>
            <p>
              Ao efetuar o cadastro, iniciar o período de testes gratuito ou contratar qualquer plano de assinatura da plataforma, o estabelecimento usuário (doravante denominado "<strong>Licenciado</strong>", "<strong>Parceiro</strong>" ou "<strong>Você</strong>") concorda expressamente com a integralidade dos termos e condições descritos abaixo. Se Você não concordar com qualquer condição deste documento, não deverá utilizar a plataforma.
            </p>

            <hr className="border-zinc-100" />

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">1. Do Objeto e Licenciamento</h2>
              <p>
                1.1. O objeto destes Termos consiste em conceder ao Licenciado uma licença de uso limitada, não exclusiva, intransferível, temporária e revogável da plataforma <strong>Venusta</strong>, unicamente para finalidades de gestão comercial interna do seu estabelecimento e fornecimento de agendamentos para seus próprios clientes.
              </p>
              <p>
                1.2. O software é fornecido na modalidade "como está" (<em>as is</em>). O Licenciado reconhece que o software é complexo e que a Licenciante não garante que a operação da plataforma será totalmente livre de interrupções, bugs ou livre de erros pontuais.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">2. Cadastro, Acesso e Comunicações Aceitáveis</h2>
              <p>
                2.1. Para utilizar a plataforma, o Licenciado deve preencher o cadastro informando dados precisos, verdadeiros e atualizados sobre seu estabelecimento comercial.
              </p>
              <p>
                2.2. A guarda e o sigilo das credenciais de acesso (e-mails e senhas) de administradores e profissionais vinculados são de responsabilidade exclusiva do Licenciado. Qualquer ação efetuada sob tais credenciais será imputada diretamente ao Licenciado.
              </p>
              <p>
                2.3. É terminantemente vedada a utilização da plataforma para quaisquer fins ilícitos, falsos, abusivos ou prejudiciais à moral e aos bons costumes.
              </p>
              <p>
                2.4. <strong>Diretrizes de E-mail Marketing e Campanhas</strong>: Caso o Licenciado utilize a infraestrutura ou ferramentas da plataforma para enviar comunicados ou e-mail marketing para seus clientes finais:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
                <li>Todas as comunicações deverão conter identificação clara e inequívoca do remetente (incluindo o nome comercial e endereço físico real do estabelecimento).</li>
                <li>As mensagens deverão fornecer um <strong>link claro, visível e de fácil acesso para descadastro</strong> (<em>opt-out</em> / desinscrição instantânea) no rodapé do e-mail.</li>
                <li>Nas comunicações enviadas por mensagens instantâneas (como lembretes de WhatsApp), o Licenciado compromete-se a respeitar a vontade do cliente de não receber mais mensagens, instruindo-o sobre o método de opt-out (ex: responder com a palavra 'SAIR' ou 'CANCELAR').</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">3. Do Período de Teste (Trial), Assinatura e Cancelamento</h2>
              <p>
                3.1. <strong>Período de Testes (Trial)</strong>: Todo novo Licenciado que criar uma conta na plataforma terá direito a <strong>7 (sete) dias corridos</strong> de acesso gratuito para teste, contados a partir da data de criação do respectivo cadastro.
              </p>
              <p>
                3.2. <strong>Bloqueio Automático</strong>: Encerrado o período de <em>trial</em>, o acesso às funcionalidades da plataforma será automaticamente suspenso, exceto se o Licenciado efetuar a contratação e o pagamento de um plano de assinatura.
              </p>
              <p>
                3.3. <strong>Assinaturas</strong>: A contratação do serviço é efetuada em caráter recorrente (mensal ou anual, conforme escolhido), mediante pagamento antecipado através de cartão de crédito ou Pix gerenciado pelo gateway parceiro.
              </p>
              <p>
                3.4. <strong>Caminho Simples para o Cancelamento</strong>: A Licenciante preza pela transparência e liberdade do cliente. O Licenciado poderá cancelar a recorrência da sua assinatura a qualquer momento, de forma autônoma e simplificada, <strong>diretamente pelas configurações da sua conta no painel administrativo</strong> (em "Configurações" -&gt; "Acesso e Assinatura" ou link equivalente do Gateway), com apenas alguns cliques, sem qualquer necessidade de contato telefônico prévio, burocracia ou preenchimento de formulários de retenção. O cancelamento interrompe a cobrança do próximo ciclo de faturamento contratado.
              </p>
              <p>
                3.5. <strong>Inadimplência</strong>: O não pagamento da mensalidade/anuidade na data de vencimento ensejará a suspensão do acesso do Licenciado após <strong>3 (três) dias corridos</strong> de atraso. Os dados cadastrados na conta serão preservados por até <strong>90 (noventa) dias</strong> para reativação, após os quais poderão ser sumariamente excluídos de nossos servidores.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">4. Das Integrações e APIs de Terceiros (Mensagens WhatsApp)</h2>
              <p>
                4.1. A plataforma <strong>Venusta</strong> disponibiliza integrações automatizadas para envio de confirmações de horários e lembretes de atendimento por meio do aplicativo WhatsApp.
              </p>
              <p>
                4.2. O Licenciado reconhece e aceita que:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
                <li>O WhatsApp é uma plataforma externa operada pela <em>Meta Platforms, Inc.</em> e regulada por políticas e restrições próprias.</li>
                <li>A Licenciante <strong>não possui qualquer gerência</strong> sobre o WhatsApp, bloqueios de contas ou atualizações na infraestrutura do aplicativo que possam interromper a integração de mensagens temporária ou definitivamente.</li>
                <li>A Licenciante <strong>não é responsável sob qualquer hipótese</strong> por eventuais suspensões de contas ou números de WhatsApp do Licenciado decorrentes de uso inadequado da ferramenta de mensagens (ex: disparo de SPAM, propaganda não solicitada, descumprimento dos Termos de Serviço do próprio WhatsApp).</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">5. Limitação de Responsabilidade</h2>
              <p>
                5.1. <strong>Ausência de Responsabilidade de Fim</strong>: A Licenciante fornece uma ferramenta de gestão e agendamento. Nós <strong>não nos responsabilizamos</strong> pela relação de consumo final estabelecida entre o Licenciado e os seus respectivos clientes. Reclamações de serviços, avarias, má prestação de serviços, falhas de atendimento, problemas com cobranças ou acidentes físicos no estabelecimento são de responsabilidade única e exclusiva do Licenciado.
              </p>
              <p>
                5.2. <strong>Indisponibilidade do Sistema</strong>: A Licenciante envidará os melhores esforços comerciais para manter a plataforma online e disponível. Contudo, Você reconhece que manutenções preventivas ou falhas fora do nosso controle (erros de hospedagem, servidores DNS, problemas no gateway de pagamentos) podem ocorrer. A Licenciante <strong>não se responsabiliza por lucros cessantes</strong>, perda de agendamentos, perda de receitas ou quaisquer prejuízos indiretos decorrentes da indisponibilidade temporária do sistema.
              </p>
              <p>
                5.3. <strong>Teto de Indenização</strong>: Em qualquer hipótese de condenação judicial decorrente do uso desta plataforma, a indenização máxima cumulada devida pela Licenciante ao Licenciado limitar-se-á ao equivalente ao valor pago pelo Licenciado nos últimos 3 (três) meses de assinatura da plataforma.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">6. Proteção de Dados e LGPD</h2>
              <p>
                6.1. O Licenciado reconhece que é o <strong>Controlador</strong> dos dados de seus clientes finais cadastrados no sistema (conforme definição da Lei nº 13.709/2018 - LGPD), cabendo ao Licenciado assegurar que possui base legal válida para a coleta e tratamento de tais dados.
              </p>
              <p>
                6.2. A Licenciante atua estritamente na qualidade de <strong>Operadora</strong> de dados, tratando as informações pessoais em nome do Licenciado, de acordo com as diretrizes e regras técnicas e operacionais descritas em nossa Política de Privacidade.
              </p>
              <p>
                6.3. O Licenciado compromete-se a indenizar e manter a Licenciante isenta contra quaisquer reclamações judiciais ou administrativas decorrentes do vazamento ou mau uso de dados causados por imperícia, dolo ou desvio de finalidade por parte do próprio Licenciado ou de seus colaboradores.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">7. Propriedade Intelectual e Conteúdos do Usuário</h2>
              <p>
                7.1. Todos os direitos de propriedade intelectual sobre o software, marca "Venusta", código-fonte, banco de dados estrutural, elementos gráficos e algoritmos são de titularidade exclusiva da <strong>VTRX SOLUTIONS TECNOLOGIA DA INFORMACAO LTDA</strong>. A concessão da licença de uso temporária não transfere ao Licenciado qualquer direito de propriedade intelectual ou propriedade industrial.
              </p>
              <p>
                7.2. O Licenciado concorda em não realizar engenharia reversa, descompilação, cópia de trechos de código ou cópia de design e identidade visual da aplicação.
              </p>
              <p>
                7.3. <strong>Responsabilidade sobre Conteúdos do Usuário</strong>: O Licenciado é o único e exclusivo responsável por toda informação, texto, imagem, fotografia, logotipo ou marca que cadastrar, carregar ou disponibilizar na plataforma. O Licenciado declara e garante possuir todos os direitos de uso de tais mídias e conteúdos.
              </p>
              <p>
                7.4. <strong>Cláusula de Remoção de Conteúdo Inadequado (Take Down Policy)</strong>: A Licenciante reserva-se o direito de <strong>remover imediatamente, de forma unilateral e sem necessidade de aviso prévio</strong>, qualquer imagem, logotipo, foto, texto ou dado inserido pelo Licenciado na plataforma que viole direitos autorais, direitos de marca, direitos de personalidade de terceiros, ou que contenha conteúdo considerado ilegal, imoral, difamatório ou inadequado.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">8. Modificações dos Termos</h2>
              <p>
                8.1. A Licenciante reserva-se o direito de atualizar ou modificar estes Termos de Uso periodicamente, notificando o Licenciado através do painel de administração da plataforma ou por e-mail, com no mínimo <strong>15 (quinze) dias</strong> de antecedência caso as alterações impliquem em obrigações financeiras adicionais ou mudanças severas de política.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-outfit font-bold text-zinc-950">9. Lei Aplicável e Foro de Eleição</h2>
              <p>
                9.1. Estes Termos de Uso serão regidos e interpretados de acordo com a legislação da República Federativa do Brasil.
              </p>
              <p>
                9.2. Para dirimir quaisquer dúvidas ou litígios decorrentes deste instrumento, as partes elegem expressamente o Foro da Comarca de domicílio da Licenciante (Timon - MA), renunciando a qualquer outro, por mais privilegiado que seja.
              </p>
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
