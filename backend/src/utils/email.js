// src/utils/email.js
import nodemailer from 'nodemailer';
//criar uma conta no Ethereal.
// Função para criar o transportador de e-mail
async function createTransporter() {
  // Para desenvolvimento, usaremos uma conta de teste do Ethereal
  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  // AQUI você configuraria um serviço de e-mail de produção (ex: SendGrid, Amazon SES)
  // ...
}

// Função principal para enviar os e-mails
export async function sendEmail({ to, subject, html }) {
  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: '"Gota a Gota" <naoresponda@gotaagota.com>',
    to,
    subject,
    html,
  });

  // Se estivermos em desenvolvimento, loga a URL para visualizar o e-mail
  if (process.env.NODE_ENV === 'development') {
    console.log("📬 E-mail de teste enviado! Visualize em: %s", nodemailer.getTestMessageUrl(info));
  }
}