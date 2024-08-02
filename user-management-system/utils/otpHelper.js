const bcrypt = require('bcrypt');
const { sendEmails } = require('./sendEmail');
const sendSMS = require('./sendSMS');

const db = require('../config/dbConnection');

const User = db.User;

// params = {emailOrMobile: 'abc@outlook.com', auth_type:'email'}
// Params = {emailOrMobile: '+91xxxxxxxxxx', auth_type:'mobile'}
const generateUserOTP = async (params) => {
  try {
    // Generate OTP
    const otp = (
      Math.floor(Math.random() * (999999 - 100000)) + 100000
    ).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // // save Hashed OTP to the Redis
    // const saved = await client.set(params.emailOrMobile, hashedOTP, {
    //   EX: 5 * 60 // OTP will expire in 5 min
    // });

    // if OTP saved, send OTP to the User

    console.log('OTP :: ', otp);
    if (params.auth_type === 'email') {
      const emailResponse = await sendEmails({
        to: params.emailOrMobile,
        OTP: otp
      });
      return hashedOTP;

      //return otp;
    } else {
      // Send OTP via SMS
      const message = `Your OTP: ${otp} Validity: 30 sec`;
      console.log(params.emailOrMobile);
      sendSMS(params.emailOrMobile, message);
      //console.log(sms_response);
      return hashedOTP;
    }
  } catch (error) {
    return false;
  }
};

// params = {emailOrMobile: 'abc@outlook.com', otp: '1234'}
// Params = {emailOrMobile: '+91xxxxxxxxxx', otp :'1234'}
const validateUserOTP = async (params) => {
  try {
    const { otp } = await User.findOne({
      where: {
        id: params.id
      },
      attributes: ['otp']
    });

    if (!otp) return false;
    const match = await bcrypt.compare(params.otp.toString(), otp);

    return match;
    //next();
  } catch (error) {
    return error;
  }
};

module.exports = {
  generateUserOTP: generateUserOTP,
  validateUserOTP: validateUserOTP
};
