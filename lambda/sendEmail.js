// Lambda function para enviar emails usando AWS SES
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    // Parse do body (vem do frontend)
    const body = JSON.parse(event.body || '{}');
    const { to, subject, text, html } = body;

    // Validação básica
    if (!to || !subject || (!text && !html)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Campos obrigatórios: to, subject, e (text ou html)' 
        })
      };
    }

    // Configurar transporter do nodemailer com SES SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM, // Email verificado no SES
      to: to,
      subject: subject,
      text: text,
      html: html || text,
    });

    console.log('Email enviado:', info.messageId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Email enviado com sucesso!',
        messageId: info.messageId
      })
    };

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erro ao enviar email',
        details: error.message
      })
    };
  }
};
