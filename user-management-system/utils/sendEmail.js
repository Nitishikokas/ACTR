const nodemailer = require('nodemailer');

const MAIL_SETTINGS = {
  host: process.env.SENDGRID_HOST,
  port: process.env.SENDGRID_PORT,
  //secure: true,
  service: 'SendGrid',
  auth: {
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_PASS
  }
};

// Send Email OTP
const sendEmails = async (params) => {
  try {
    // Email Configuration
    const transporter = await nodemailer.createTransport(MAIL_SETTINGS);

    let info = await transporter.sendMail({
      //from: MAIL_SETTINGS.auth.user,
      from: process.env.SENDGRID_EMAIL_FROM,
      to: params.to, // list of receivers
      //to: 'ikokas_taskmanager@outlook.com', // list of receivers
      subject: 'Task Manager', // Subject line
      html: `
      <div
        class="container"
        style="max-width: 90%; margin: auto; padding-top: 20px"
      >
        <h2>Welcome to the Task Manager.</h2>
        <p style="margin-bottom: 30px;">Pleas enter the sign up OTP, it is valid only for five minutes</p>
        <h2 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${params.OTP}</h2>
        <p style="margin-top:50px;">If you do not request for verification please do not respond to the mail. You can in turn un subscribe to the mailing list and we will never bother you again.</p>
      </div>
    `
    });
    console.log('info::', info);
    return info;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  sendEmails: sendEmails
};
