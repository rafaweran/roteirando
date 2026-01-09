/**
 * Serviço de envio de email
 * Por enquanto simula o envio, mas pode ser integrado com:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Nodemailer
 * - Supabase Edge Functions
 */

interface EmailCredentials {
  email: string;
  password: string;
  leaderName: string;
  groupName: string;
  tripName: string;
}

export async function sendCredentialsEmail(credentials: EmailCredentials): Promise<boolean> {
  try {
    // Em produção, aqui você faria a chamada real para o serviço de email
    // Por enquanto, apenas simulamos e mostramos no console
    
    const emailContent = `
Olá ${credentials.leaderName},

Sua conta foi criada com sucesso no sistema Roteirando!

Aqui estão suas credenciais de acesso:

📧 E-mail: ${credentials.email}
🔑 Senha: ${credentials.password}

Grupo: ${credentials.groupName}
Viagem: ${credentials.tripName}

IMPORTANTE: Por segurança, recomendamos que você altere sua senha no primeiro acesso.

Acesse: [URL do sistema]

Atenciosamente,
Equipe Roteirando
    `.trim();

    console.log('='.repeat(60));
    console.log('📧 EMAIL ENVIADO (SIMULADO)');
    console.log('='.repeat(60));
    console.log(`Para: ${credentials.email}`);
    console.log(`Assunto: Credenciais de Acesso - Roteirando`);
    console.log('-'.repeat(60));
    console.log(emailContent);
    console.log('='.repeat(60));
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Em produção, descomente e configure:
    /*
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: credentials.email }],
          subject: 'Credenciais de Acesso - Roteirando'
        }],
        from: { email: 'noreply@roteirando.com' },
        content: [{
          type: 'text/plain',
          value: emailContent
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error('Erro ao enviar email');
    }
    */
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Exemplo de integração com Supabase Edge Functions
 */
export async function sendEmailViaSupabase(credentials: EmailCredentials): Promise<boolean> {
  try {
    // Exemplo usando Supabase Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: credentials.email,
        subject: 'Credenciais de Acesso - Roteirando',
        template: 'credentials',
        data: credentials
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar email via Supabase:', error);
    return false;
  }
}


