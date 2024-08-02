module.exports = (sequelize, DataTypes) => {
  const UserBankDetails = sequelize.define('user_bank_detail', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    account_no: {
      type: DataTypes.STRING,
      allowNull: false
    },
    account_holder_name: {
      type: DataTypes.STRING
    },
    pan_no: {
      type: DataTypes.STRING
    },
    bank_name: {
      type: DataTypes.STRING
    },
    bank_ifsc: {
      type: DataTypes.STRING
    },
    bank_address: {
      type: DataTypes.STRING
    },
    is_default: {
      type: DataTypes.INTEGER
    },
    is_deleted: {
      type: DataTypes.INTEGER
    }
  });

  return UserBankDetails;
};
