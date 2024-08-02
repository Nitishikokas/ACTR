const createError = require('http-errors');
const db = require('../../config/dbConnection');

const {
  isValidEmail,
  isValidMobile,
  hasCountryCode
} = require('../../utils/common');

const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getForgotPasswordResetLink,
  verifyForgotPasswordToken
} = require('../../utils/jwtHelper');

const { hashPassword, isValidPassword } = require('../../utils/passwordHelper');
const { sendEmails } = require('../../utils/sendEmail');

const Admin = db.Admin;
const Op = db.Op;

const whoAmI = (req, res, next) => {
  res.send('this is admin route');
};

const adminSignup = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone_number, password } = req.body;

    // check for the required fields.
    if (!first_name) throw createError.BadRequest(`First Name is required`);
    if (!last_name) throw createError.BadRequest(`Last Name is required`);
    if (!email) throw createError.BadRequest(`email is required`);
    if (!phone_number) throw createError.BadRequest(`phone_number is required`);
    if (!password) throw createError.BadRequest(`Password is required`);

    // check for the password length
    if (password.length < 8 || password.length > 16)
      throw createError.BadRequest(
        `Password length should be between 8 and 16`
      );

    // check for valid email and mobile number.
    if (email && !isValidEmail(email))
      throw createError.BadRequest('Please enter a valid email id.');

    // check if phone has country code
    if (!hasCountryCode(phone_number))
      throw createError.BadRequest('Please enter mobile no with country code.');

    // check for valid phone no
    const validMobile = isValidMobile(phone_number);
    if (phone_number && !validMobile.isValid)
      throw createError.BadRequest('Please enter a valid phone_number.');

    // Check if user already registered with same email or mobile
    const user = await Admin.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { phone_number: phone_number }
        ]
      }
    });

    /**
     * Generate OTP
     */

    // Hash Password
    const hashedPassword = await hashPassword(password);

    if (!hashedPassword)
      throw createError.InternalServerError(`Password hashing failed`);

    //console.log(user);
    if (user) {
      throw createError.Conflict(`User already registered`);
    }

    const newUser = await Admin.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      phone_number,
      password: hashedPassword
    });

    // delete password in the response
    newUser.password = '';

    res.send({ message: 'Signed Up successfully', data: newUser, status: 200 });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check for the required fields.

    if (!email) throw createError.BadRequest(`email is required`);
    if (!password) throw createError.BadRequest(`Password is required`);

    // check for the password length
    if (password.length < 8 || password.length > 16)
      throw createError.BadRequest(
        `Password length should be between 8 and 16`
      );

    // check for valid email and mobile number.
    if (email && !isValidEmail(email))
      throw createError.BadRequest('Please enter a valid email id.');

    // check if user fond
    const user = await Admin.findOne({
      where: { email: email.toLowerCase() }
    });

    // console.log(user);
    // console.log(user.id);

    if (!user) throw createError.NotFound(`User not found`);

    // Validate the password
    const isMatch = await isValidPassword(user.password, password);
    if (!isMatch)
      throw createError.Unauthorized('username/password did not match.');

    // get access and refresh token.
    const accessToken = await signAccessToken(user);
    const refreshToken = await signRefreshToken(user, 'login');

    res.send({
      message: 'Logged in successfully',
      data: {
        accessToken,
        refreshToken,
        user_id: user.id
      },
      status: 200
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAccessTokenByRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      throw createError.BadRequest('refreshToken is mandatory');

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshToken);

    // check if user exist with the given userId
    const user = await Admin.findOne({
      where: { id: userId }
    });
    if (!user) throw createError.Unauthorized('User not found');

    if (user && user.is_deleted == true)
      throw createError.Unauthorized('User deleted');
    if (user && user.is_deactivated == true)
      throw createError.Unauthorized('User deactivated');

    // get access and refresh token.
    const newAccessToken = await signAccessToken(user);
    const newRefreshToken = await signRefreshToken(user, 'newToken');

    res.send({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      },
      message: 'New Access Token assigned',
      status: 200
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getForgotPassword = async (req, res, next) => {};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw createError.BadRequest(`email is required`);

    // check for valid email
    if (email && !isValidEmail(email))
      throw createError.BadRequest('Please enter a valid email id.');

    // check if this email found in DB
    const user = await Admin.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) throw createError.NotFound(`User not found`);

    // now user exist, create one time password link
    const link = await getForgotPasswordResetLink(user);
    if (!link)
      throw createError.InternalServerError(`Unable to generate reset link`);

    //TODO send link to email
    const emailResponse = await sendEmails({
      to: email.toLowerCase(),
      OTP: link
    });

    res.send(link);
  } catch (error) {
    next(error);
  }
};

const getResetPassword = async (req, res, next) => {
  try {
    const { id, token } = req.params;
    if (!id) throw createError.BadRequest(`Reset link is not valid`);
    if (!token) throw createError.BadRequest(`Reset link is not valid`);

    // check if user exist with the given id
    const user = await Admin.findOne({
      where: { id: parseInt(id) }
    });
    if (!user) throw createError.NotFound(`Not a valid link`);

    // verify the token if valid
    let result = verifyForgotPasswordToken(user.password, token);
    if (!result) throw createError.NotFound(`Not a valid/Expired link.`);

    // Set Flag in DB
    const [setFlag] = await Admin.update(
      { reset_link_verify: 1 },
      { where: { id: user.id } }
    );

    if (!setFlag)
      throw createError.InternalServerError('Error while verifying link');

    res.send({ message: 'Valid link', status: 200, data: 1 });
  } catch (error) {
    next(error);
  }
};

const saveResetPassword = async (req, res, next) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;
    if (!id) throw createError.BadRequest(`Reset link is not valid`);
    if (!token) throw createError.BadRequest(`Reset link is not valid`);
    if (!password) throw createError.BadRequest(`Password is required.`);

    // check for the password length
    if (password.length < 8 || password.length > 16)
      throw createError.BadRequest(
        `Password length should be between 8 and 16`
      );

    // check if user exist with the given id
    const user = await Admin.findOne({
      where: { id: parseInt(id) }
    });
    if (!user) throw createError.NotFound(`Not a valid link`);

    if (!user.reset_link_verify) throw createError.NotFound(`Not a valid link`);

    // verify the token if valid
    let result = verifyForgotPasswordToken(user.password, token);
    if (!result) throw createError.NotFound(`Not a valid/Expired link.`);

    // hash password
    const hashedPassword = await hashPassword(password);

    if (!hashedPassword)
      throw createError.InternalServerError(`Password hashing failed`);

    // Set Flag in DB
    const [updated] = await Admin.update(
      { password: hashedPassword, reset_link_verify: 0 },
      { where: { id: user.id } }
    );

    if (!updated)
      throw createError.InternalServerError(`Error while re-setting password`);

    res.send({
      message: 'Password Reset successfully',
      status: 200,
      data: { user_id: user.id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  whoAmI,
  adminSignup,
  adminLogin,
  getAccessTokenByRefreshToken,
  getForgotPassword,
  forgotPassword,
  getResetPassword,
  saveResetPassword
};
