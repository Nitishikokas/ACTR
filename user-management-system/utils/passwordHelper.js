const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.log(error);
  }
};

const isValidPassword = async (db_pass, password) => {
  try {
    //console.log({ db_pass, password });
    return await bcrypt.compare(password, db_pass);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  hashPassword,
  isValidPassword
};
