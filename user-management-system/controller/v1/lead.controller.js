const createError = require('http-errors');
const db = require('../../config/dbConnection');

const { isValidMobile, hasCountryCode } = require('../../utils/common');

const User = db.User;
const Lead = db.Lead;
const Op = db.Op;
const UserBankDetail = db.UserBankDetail;

const saveLeads = async (req, res, next) => {
  try {
    const { aud } = req.payload;
    const { full_name, pan, mobile, loan_amount } = req.body;

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');

    if (!full_name) throw createError.BadRequest('full_name is required');
    if (!mobile) throw createError.BadRequest('mobile is required');
    if (!loan_amount) throw createError.BadRequest('loan_amount is required');

    // check if phone has country code
    if (!hasCountryCode(mobile))
      throw createError.BadRequest('Please enter mobile no with country code.');

    // check for valid phone no
    const validMobile = isValidMobile(mobile);
    if (mobile && !validMobile.isValid)
      throw createError.BadRequest('Please enter a valid mobile.');

    // check if same Lead already exists
    const exists = await Lead.findOne({
      where: { mobile: mobile }
    });

    if (exists) throw createError.Conflict('Give mobile number already found.');

    // save the account number
    let data = {
      lead_created_by: aud,
      full_name,
      pan,
      mobile,
      loan_amount,
      status: 1
    };
    const newLead = await Lead.create(data);

    if (!newLead)
      throw createError.InternalServerError(`Error while saving Bank Details`);

    res.send({
      message: 'Lead Creation Successful',
      data: newLead,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const { aud } = req.payload;

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');

    // check if same account already exists
    const lead = await Lead.findAll({
      where: { lead_created_by: aud }
    });

    if (!lead.length)
      throw createError.NotFound('No Leads details found for this user.');

    res.send({
      message: 'Leads Details',
      data: lead,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const updateLeads = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { aud } = req.payload;
    const { full_name, pan, mobile, loan_amount } = req.body;

    if (!id) throw createError.BadRequest('id is required');

    if (!aud)
      throw createError.BadRequest('User not found, Please login again');

    if (!full_name) throw createError.BadRequest('full_name is required');
    if (!mobile) throw createError.BadRequest('mobile is required');
    if (!loan_amount) throw createError.BadRequest('loan_amount is required');

    // check if phone has country code
    if (!hasCountryCode(mobile))
      throw createError.BadRequest('Please enter mobile no with country code.');

    // check for valid phone no
    const validMobile = isValidMobile(mobile);
    if (mobile && !validMobile.isValid)
      throw createError.BadRequest('Please enter a valid mobile.');

    // check if same Lead already exists
    const exists = await Lead.findOne({
      where: { id: id }
    });

    if (!exists) throw createError.NotFound('Give id not found.');

    // save the account number
    let data = {
      full_name,
      pan,
      mobile,
      loan_amount
    };

    const newLead = await Lead.update(data, {
      where: {
        id: id
      },
      returning: true
    });

    if (!newLead)
      throw createError.InternalServerError(
        `Error while updating Lead Details`
      );

    res.send({
      message: 'Lead Details Update Successful',
      data: newLead,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveLeads,
  getLeads,
  updateLeads
};
