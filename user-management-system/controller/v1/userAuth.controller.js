const createError = require('http-errors');
const db = require('../../config/dbConnection');
var validator = require('aadhaar-validator');

const {
  isValidEmail,
  isValidMobile,
  hasCountryCode
} = require('../../utils/common');
const { generateUserOTP, validateUserOTP } = require('../../utils/otpHelper');
const { sendEmails } = require('../../utils/sendEmail');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} = require('../../utils/jwtHelper');

const User = db.User;
const Address = db.Address;
const Op = db.Op;

const getOTP = async (req, res, next) => {
  try {
    const { mobile, pin_code, user_type } = req.body;

    if (!mobile) throw createError.BadRequest(`mobile is required`);
    if (!pin_code) throw createError.BadRequest(`pin_code is required`);
    if (!user_type) throw createError.BadRequest(`user_type is required`);

    // check if phone has country code
    if (!hasCountryCode(mobile))
      throw createError.BadRequest('Please enter mobile no with country code.');

    // check for valid phone no
    const validMobile = isValidMobile(mobile);
    if (mobile && !validMobile.isValid)
      throw createError.BadRequest('Please enter a valid mobile.');

    // Check if user already registered with same email or mobile
    const user = await User.findOne({
      where: { mobile: mobile }
    });

    if (user) {
      // check if OTP is verified
      if (user.is_otp_verified) {
        throw createError.Conflict(`User already registered`);
      } else {
        // regenerate the OTP
        // generate OTP
        const newOTP = await generateUserOTP({
          auth_type: 'mobile',
          emailOrMobile: mobile
        });

        if (!newOTP)
          throw createError.InternalServerError(`OTP Generation failed`);

        // store the new OTP in the Table
        // update the user table
        const isUpdated = await User.update(
          { otp: newOTP },
          { where: { id: user.id } }
        );
        res.send({
          message: 'OTP Generated successfully',
          data: user,
          status: 200
        });
        return;
      }
    }

    // generate OTP
    const otpGenerated = await generateUserOTP({
      auth_type: 'mobile',
      emailOrMobile: mobile
    });

    if (!otpGenerated)
      throw createError.InternalServerError(`OTP Generation failed`);

    // create user and save details to DB
    let data = {
      mobile: mobile,
      pin_code: pin_code,
      user_type: user_type,
      otp: otpGenerated
    };

    const newUser = await User.create(data);

    if (!newUser)
      throw createError.InternalServerError(`OTP Generation failed`);

    res.send({
      message: 'OTP Generated successfully',
      data: newUser,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { user_id, otp } = req.body;
    if (!user_id) throw createError.BadRequest('user_id is required');
    if (!otp) throw createError.BadRequest('otp is required');

    // check if user exist
    //const user = await service.getUser({ user_id });
    const user = await User.findOne({
      where: { id: user_id }
    });
    if (!user)
      throw createError.BadRequest('user does not exist with given user_id');

    const isValid = await validateUserOTP({ id: user_id, otp });
    if (!isValid) throw createError.Unauthorized('OTP is not valid.');

    // update the user table
    const isUpdated = await User.update(
      { is_otp_verified: 1, form_step: 1 },
      { where: { id: user_id } }
    );

    if (isUpdated) {
      res.send({ message: 'OTP verified successfully', status: 200 });
    } else {
      res.send({ message: 'Invalid OTP', status: 400 });
    }
  } catch (error) {
    next(error);
  }
};

const verifyAadhar = async (req, res, next) => {
  try {
    const { aadhar } = req.body;
    if (!aadhar) throw createError.BadRequest('aadhar is required');

    // Validate Aadhar Number
    const isValid = validator.isValidNumber(aadhar.toString());

    if (!isValid) throw createError.BadRequest('Please enter valid aadhar no.');

    // dummy data
    let dummyAadharData = {
      address: {
        prob: 0.5,
        value:
          'S/O Tony, Seer 40, S/O Julie, 40, Dewdrops Street, Cherry Hill       Pondicherry, Pondicherry ureing4Gen, ureing4Gen 605008 '
      },
      gender: { prob: '0.9', value: 'male' },
      dob: { prob: '0.6', value: '12/12/2012' },
      name: { prob: '0.8', value: 'Hari Krishnan' },
      aadhaar: { prob: 0.8, value: '1234 5678 0123' }
    };

    res.send({
      status: 200,
      data: dummyAadharData,
      message: 'Dummy Aadhar details'
    });
  } catch (error) {
    next(error);
  }
};

const saveAddressAndContactDetails = async (req, res, next) => {
  try {
    const {
      user_id,
      aadhar_number,
      address_on_aadhar,
      current_address_as_permanent,
      current_house_no,
      current_street_name,
      current_pin_code,
      current_city,
      current_state,
      full_name,
      alternate_mobile,
      email,
      highest_education,
      occupation,
      device_id,
      device_token
    } = req.body;

    if (!user_id) throw createError.BadRequest('user_id is required');
    if (!aadhar_number)
      throw createError.BadRequest('aadhar_number is required');
    if (!address_on_aadhar)
      throw createError.BadRequest('address_on_aadhar is required');

    if (!full_name) throw createError.BadRequest('full_name is required');
    if (!highest_education)
      throw createError.BadRequest('highest_education is required');
    if (!occupation) throw createError.BadRequest('occupation is required');

    if (alternate_mobile) {
      // check if phone has country code
      if (!hasCountryCode(alternate_mobile))
        throw createError.BadRequest(
          'Please enter alternate mobile no. with country code.'
        );

      // check for valid phone no
      const validMobile = isValidMobile(alternate_mobile);
      if (alternate_mobile && !validMobile.isValid)
        throw createError.BadRequest('Please enter a valid alternate mobile.');
    }

    // if email: check if email is valid
    if (email && !isValidEmail(email))
      throw createError.BadRequest('Please enter a valid email id.');

    // get user_id
    const user = await User.findOne({
      where: { id: parseInt(user_id), is_otp_verified: 1 }
    });
    if (!user)
      throw createError.BadRequest('user does not exist with given user_id');

    // condition if current address is not as permenent address
    if (!current_address_as_permanent) {
      if (!current_house_no)
        throw createError.BadRequest(
          'current_house_no is required when permanent is not current address'
        );
      if (!current_street_name)
        throw createError.BadRequest(
          'current_street_name is required when permanent is not current address'
        );
      if (!current_pin_code)
        throw createError.BadRequest(
          'current_pin_code is required when permanent is not current address'
        );
      if (!current_city)
        throw createError.BadRequest(
          'current_city is required when permanent is not current address'
        );
      if (!current_state)
        throw createError.BadRequest(
          'current_state is required when permanent is not current address'
        );
    }

    // check if address is already present
    const address = await Address.findOne({
      where: { user_id: parseInt(user_id) }
    });
    if (address)
      throw createError.BadRequest('Address already exist for this user.');

    let data = {
      user_id,
      aadhar_number,
      address_on_aadhar,
      current_address_as_permanent,
      current_house_no,
      current_street_name,
      current_pin_code,
      current_city,
      current_state
    };

    const newAddress = await Address.create(data);

    if (!newAddress)
      throw createError.InternalServerError(`Error while saving Address`);

    // update below one in users table
    let updateUserData = {
      full_name,
      alternate_mobile,
      email,
      highest_education,
      occupation,
      device_id,
      device_token,
      form_step: 2
    };

    const isUpdated = await User.update(updateUserData, {
      where: { id: user.id }
    });

    if (!isUpdated)
      throw createError.InternalServerError(
        `Error while saving contact details`
      );

    // get access and refresh tokens
    const accessToken = await signAccessToken(user);
    const refreshToken = await signRefreshToken(user, 'signup', true);

    res.send({
      message: 'User Creation Successful',
      data: {
        accessToken,
        refreshToken,
        user_id: user.id
      },
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getAccessTokenByRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      throw createError.BadRequest('refreshToken is mandatory');

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshToken, true);

    // check if user exist with the given userId
    const user = await User.findOne({
      where: { id: userId }
    });
    if (!user) throw createError.Unauthorized('User not found');

    if (user && user.is_deleted == true)
      throw createError.Unauthorized('User deleted');
    if (user && user.is_deactivated == true)
      throw createError.Unauthorized('User deactivated');

    // get access and refresh token.
    const newAccessToken = await signAccessToken(user);
    const newRefreshToken = await signRefreshToken(user, 'newToken', true);

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

const getLoginOTP = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    if (!mobile) throw createError.BadRequest(`mobile is required`);

    // check if phone has country code
    if (!hasCountryCode(mobile))
      throw createError.BadRequest('Please enter mobile no with country code.');

    // check for valid phone no
    const validMobile = isValidMobile(mobile);
    if (mobile && !validMobile.isValid)
      throw createError.BadRequest('Please enter a valid mobile.');

    // Check if user already registered with same email or mobile
    const user = await User.findOne({
      where: { mobile: mobile }
    });

    // check if user is deleted or deactivated
    if (user && (user.is_deleted || user.is_deactivated))
      throw createError.Conflict(`User is Deleted/Deactivated`);

    // generate OTP
    const otpGenerated = await generateUserOTP({
      auth_type: 'mobile',
      emailOrMobile: mobile
    });

    if (!otpGenerated)
      throw createError.InternalServerError(`OTP Generation failed`);

    // create user and save details to DB
    let data = {
      mobile: mobile,
      otp: otpGenerated
    };

    const newUser = await User.update(
      { otp: otpGenerated },
      { where: { id: user.id } }
    );

    if (!newUser)
      throw createError.InternalServerError(`OTP Generation failed`);

    res.send({
      message: 'OTP Generated successfully',
      data: newUser,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const verifyLoginOTP = async (req, res, next) => {
  try {
    const { user_id, otp } = req.body;
    if (!user_id) throw createError.BadRequest('user_id is required');
    if (!otp) throw createError.BadRequest('otp is required');

    // check if user exist
    //const user = await service.getUser({ user_id });
    const user = await User.findOne({
      where: { id: user_id }
    });
    if (!user)
      throw createError.BadRequest('user does not exist with given user_id');

    const isValid = await validateUserOTP({ id: user_id, otp });
    if (!isValid) throw createError.Unauthorized('OTP is not valid.');

    // check if user has completed all the steps
    if (user.form_step !== 2) {
      res.send({
        message:
          'User has not completed all the steps, please complete the remaining steps',
        status: 207,
        data: {
          form_step: user.form_step
        }
      });
      return;
    }

    // get access and refresh token.
    const newAccessToken = await signAccessToken(user);
    const newRefreshToken = await signRefreshToken(user, 'Login', true);

    if (newAccessToken) {
      res.send({
        message: 'OTP verified successfully',
        status: 200,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } else {
      res.send({ message: 'Invalid OTP', status: 400 });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOTP,
  verifyOTP,
  saveAddressAndContactDetails,
  verifyAadhar,
  getAccessTokenByRefreshToken,
  getLoginOTP,
  verifyLoginOTP
};
