import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getHeaderPrefeitura = (titulo: string) => `
  <div style="background-color: #004B87; padding: 25px 20px; text-align: center; border-bottom: 5px solid #FFC72C;">
    <h2 style="margin: 0; color: white; font-size: 16px; font-weight: normal; text-transform: uppercase; letter-spacing: 2px;">
      Prefeitura de Uberlândia
    </h2>
    <h1 style="margin: 10px 0 0 0; color: white; font-size: 26px; font-weight: bold;">
      FUTEL
    </h1>
    <p style="margin: 5px 0 0 0; color: #a1c8e8; font-size: 14px;">
      Fundação Uberlandense de Turismo, Esporte e Lazer
    </p>
  </div>
  <div style="background-color: #009A44; color: white; padding: 12px 20px; text-align: center; font-weight: bold; font-size: 18px;">
    ${titulo}
  </div>
`;

const getFooterPrefeitura = () => `
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #ddd; margin-top: 30px;">
    <p style="margin: 0; color: #555; font-size: 12px; font-weight: bold;">
      Prefeitura Municipal de Uberlândia - FUTEL
    </p>
    <p style="margin: 5px 0 0 0; color: #777; font-size: 11px;">
      Av. José Roberto Migliorini, 850 – Santa Mônica (Parque do Sabiá)
    </p>
    <p style="margin: 15px 0 0 0; color: #999; font-size: 10px;">
      Este é um e-mail automático. Por favor, não responda.
    </p>
  </div>
`;

export async function enviarEmailConfirmacao(
  to: string, 
  nomeCidadao: string, 
  quadra: string, 
  data: string, 
  horario: string,
  nomeTime?: string,
  nomeResponsavel?: string
) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      ${getHeaderPrefeitura('CONFIRMAÇÃO DE RESERVA')}
      
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px;">Olá, <strong>${nomeCidadao}</strong>.</p>
        <p style="font-size: 16px;">Sua reserva foi registrada com sucesso no sistema oficial da FUTEL.</p>
        
        <div style="background-color: #f4f6f8; border-left: 5px solid #004B87; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #004B87; font-size: 16px;">DETALHES DO AGENDAMENTO</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #555; width: 100px;"><strong>Local:</strong></td>
              <td style="padding: 5px 0; color: #111;">${quadra}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;"><strong>Data:</strong></td>
              <td style="padding: 5px 0; color: #111;">${data}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;"><strong>Horário:</strong></td>
              <td style="padding: 5px 0; color: #111;">${horario}</td>
            </tr>
            ${nomeTime ? `
            <tr>
              <td style="padding: 5px 0; color: #555;"><strong>Time:</strong></td>
              <td style="padding: 5px 0; color: #111;">${nomeTime}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;"><strong>Responsável:</strong></td>
              <td style="padding: 5px 0; color: #111;">${nomeResponsavel}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <h4 style="color: #009A44; margin: 20px 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Orientações Importantes</h4>
        <ul style="color: #555; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0;">
          <li>Apresente um documento com foto no local e horário agendados.</li>
          <li>Chegue com 15 minutos de antecedência.</li>
          <li>Em caso de impossibilidade de comparecimento, favor cancelar sua reserva pelo portal.</li>
        </ul>
        
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-top: 25px; font-size: 13px; border-left: 4px solid #ffeeba;">
          <strong>Aviso:</strong> Reservas estão sujeitas a cancelamentos administrativos devido a manutenções emergenciais ou eventos oficiais da Prefeitura. Você será notificado caso isso ocorra.
        </div>
      </div>
      
      ${getFooterPrefeitura()}
    </div>
  `;

  await transporter.sendMail({
    from: `"Quadras FUTEL" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Confirmação de Reserva - ${data} às ${horario}`,
    html: htmlContent,
  });
}

export async function enviarEmailRecuperacao(to: string, token: string, baseUrl: string) {
  const link = `${baseUrl}/reset-senha?token=${token}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0;">
      ${getHeaderPrefeitura('RECUPERAÇÃO DE SENHA')}
      <div style="padding: 30px 20px; text-align: center;">
        <p style="font-size: 16px; text-align: left;">Olá,</p>
        <p style="font-size: 16px; text-align: left;">Recebemos uma solicitação para redefinir a senha do seu acesso ao portal de agendamentos da FUTEL.</p>
        
        <div style="margin: 40px 0;">
          <a href="${link}" style="background-color: #004B87; color: white; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
            REDEFINIR MINHA SENHA
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: left; background-color: #f9f9f9; padding: 15px; border-left: 4px solid #009A44;">
          <strong>Atenção:</strong> Este link expira em 1 hora. Se você não solicitou a alteração de senha, ignore este e-mail por segurança.
        </p>
      </div>
      ${getFooterPrefeitura()}
    </div>
  `;

  await transporter.sendMail({
    from: `"Quadras FUTEL" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Recuperação de Senha - FUTEL`,
    html: htmlContent,
  });
}

export async function enviarEmailMensagemAdmin(to: string, mensagem: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0;">
      ${getHeaderPrefeitura('MENSAGEM DA ADMINISTRAÇÃO')}
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px;">Olá,</p>
        <p style="font-size: 16px;">A administração da FUTEL enviou um comunicado a respeito de sua reserva:</p>
        
        <div style="background-color: #f4f6f8; padding: 25px; border-left: 5px solid #004B87; margin: 30px 0; font-size: 16px; line-height: 1.6; white-space: pre-wrap; font-style: italic; color: #222;">
          "${mensagem}"
        </div>
        
        <p style="font-size: 15px; color: #555;">Caso haja dúvidas ou necessite de suporte adicional, entre em contato através dos nossos canais oficiais de atendimento.</p>
      </div>
      ${getFooterPrefeitura()}
    </div>
  `;

  await transporter.sendMail({
    from: `"Quadras FUTEL" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Comunicado Oficial da Administração - FUTEL`,
    html: htmlContent,
  });
}

export async function enviarEmailCancelamentoAdmin(
  to: string,
  nomeCidadao: string,
  quadra: string,
  data: string,
  horario: string,
  motivo: string
) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0;">
      ${getHeaderPrefeitura('RESERVA CANCELADA')}
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px;">Olá, <strong>${nomeCidadao}</strong>.</p>
        
        <div style="background-color: #fff0f0; border: 1px solid #f5c2c7; border-left: 5px solid #dc3545; padding: 20px; border-radius: 4px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; color: #842029; font-weight: bold; font-size: 16px;">Aviso de Cancelamento Administrativo</p>
          <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.5;">
            Sua reserva para o local <strong>${quadra}</strong> no dia <strong>${data}</strong> às <strong>${horario}</strong> foi cancelada pela equipe da FUTEL.
          </p>
        </div>

        <h4 style="color: #004B87; margin: 25px 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Motivo do Cancelamento</h4>
        <div style="background-color: #f8f9fa; padding: 15px; font-size: 15px; color: #444; border-left: 4px solid #009A44;">
          ${motivo}
        </div>
        
        <p style="margin-top: 30px; font-size: 15px; color: #555;">Pedimos desculpas pelo transtorno ocasionado. Informamos que o sistema encontra-se disponível para realizar um novo agendamento, sujeito a disponibilidade.</p>
      </div>
      ${getFooterPrefeitura()}
    </div>
  `;

  await transporter.sendMail({
    from: `"Quadras FUTEL" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Cancelamento de Reserva - ${data} às ${horario}`,
    html: htmlContent,
  });
}

export async function enviarEmailReagendamento(
  to: string,
  nomeCidadao: string,
  quadra: string,
  dataAntiga: string,
  horarioAntigo: string,
  novaData: string,
  novoHorario: string
) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0;">
      ${getHeaderPrefeitura('RESERVA REAGENDADA')}
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px;">Olá, <strong>${nomeCidadao}</strong>.</p>
        
        <div style="background-color: #f4f6f8; border-left: 5px solid #004B87; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; color: #004B87; font-weight: bold; font-size: 16px;">Aviso de Reagendamento Administrativo</p>
          <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.5;">
            Sua reserva para o local <strong>${quadra}</strong> foi reagendada pela equipe da FUTEL.
          </p>
        </div>

        <h4 style="color: #004B87; margin: 25px 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Detalhes da Alteração</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 10px; background-color: #fff0f0; color: #842029; border: 1px solid #f5c2c7; width: 50%;">
              <strong>De:</strong><br/>
              Data: ${dataAntiga}<br/>
              Horário: ${horarioAntigo}
            </td>
            <td style="padding: 10px; background-color: #f0fdf4; color: #0f5132; border: 1px solid #c3e6cb; width: 50%;">
              <strong>Para:</strong><br/>
              Data: ${novaData}<br/>
              Horário: ${novoHorario}
            </td>
          </tr>
        </table>
        
        <p style="margin-top: 30px; font-size: 15px; color: #555;">Este reagendamento foi realizado conforme solicitação ou necessidade administrativa. Em caso de dúvidas, entre em contato.</p>
      </div>
      ${getFooterPrefeitura()}
    </div>
  `;

  await transporter.sendMail({
    from: `"Quadras FUTEL" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Reagendamento de Reserva - ${novaData} às ${novoHorario}`,
    html: htmlContent,
  });
}
