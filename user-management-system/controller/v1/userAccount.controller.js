const createError = require('http-errors');
const db = require('../../config/dbConnection');

const User = db.User;
const Address = db.Address;
const Op = db.Op;
const UserBankDetail = db.UserBankDetail;

const saveBankDetails = async (req, res, next) => {
  try {
    const { aud } = req.payload;
    const {
      account_no,
      account_holder_name,
      pan_no,
      bank_name,
      bank_ifsc,
      bank_address
    } = req.body;

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');

    if (!account_no) throw createError.BadRequest('account_no is required');

    // check if same account already exists
    const exists = await UserBankDetail.findOne({
      where: { account_no: account_no, is_deleted: 0 || null }
    });

    if (exists)
      throw createError.Conflict('Given account number already found.');

    // save the account number
    let data = {
      user_id: aud,
      account_no,
      account_holder_name,
      pan_no,
      bank_name,
      bank_ifsc,
      bank_address
    };
    const newBankAccount = await UserBankDetail.create(data);

    if (!newBankAccount)
      throw createError.InternalServerError(`Error while saving Bank Details`);

    res.send({
      message: 'Bank Details Creation Successful',
      data: newBankAccount,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getBankDetails = async (req, res, next) => {
  try {
    const { aud } = req.payload;

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');

    // check if same account already exists
    const bankAccounts = await UserBankDetail.findAll({
      where: { user_id: aud, is_deleted: 0 || null }
    });

    if (!bankAccounts)
      throw createError.NotFound('No Banks details found for this user.');

    res.send({
      message: 'Bank Details',
      data: bankAccounts,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const updateBankDetails = async (req, res, next) => {
  try {
    const { aud } = req.payload;
    const { id } = req.params;
    const {
      account_no,
      account_holder_name,
      pan_no,
      bank_name,
      bank_ifsc,
      bank_address
    } = req.body;

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');
    if (!id) throw createError.BadRequest('id is required');

    if (!account_no) throw createError.BadRequest('account_no is required');

    // check if same account already exists
    const exists = await UserBankDetail.findOne({
      where: { user_id: aud, id: id, is_deleted: 0 || null }
    });

    if (!exists) throw createError.NotFound('Given account number not found.');

    // save the account number
    let data = {
      account_no,
      account_holder_name,
      pan_no,
      bank_name,
      bank_ifsc,
      bank_address
    };

    const newBankAccount = await UserBankDetail.update(data, {
      where: {
        user_id: aud,
        id: id
      },
      returning: true
    });

    if (!newBankAccount)
      throw createError.InternalServerError(`Error while saving Bank Details`);

    res.send({
      message: 'Bank Details Update Successful',
      data: newBankAccount,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getContactDetails = async (req, res, next) => {
  try {
    const { aud } = req.payload;

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');

    // check if same account already exists
    const contact = await User.findOne({
      where: { id: aud, is_deleted: 0 || null },
      attributes: ['full_name', 'email', 'mobile', 'alternate_mobile']
    });

    if (!contact)
      throw createError.NotFound('No Contact details found for this user.');

    res.send({
      message: 'Contact Details',
      data: contact,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getAddressDetails = async (req, res, next) => {
  try {
    const { aud } = req.payload;

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');

    // check if same account already exists
    const address = await Address.findOne({
      where: { user_id: aud }
    });

    if (!address)
      throw createError.NotFound('No Address details found for this user.');

    res.send({
      message: 'Address Details',
      data: address,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveBankDetails,
  getBankDetails,
  updateBankDetails,
  getContactDetails,
  getAddressDetails
};
