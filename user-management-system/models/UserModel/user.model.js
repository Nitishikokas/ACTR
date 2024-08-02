module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alternate_mobile: {
      type: DataTypes.STRING
    },
    pin_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    highest_education: {
      type: DataTypes.STRING
    },
    occupation: {
      type: DataTypes.STRING
    },
    user_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_otp_verified: {
      type: DataTypes.INTEGER
    },
    is_deleted: {
      type: DataTypes.INTEGER
    },
    is_deactivated: {
      type: DataTypes.INTEGER
    },
    form_step: {
      type: DataTypes.INTEGER
    },
    role: {
      type: DataTypes.INTEGER
    },
    group: {
      type: DataTypes.INTEGER
    },
    device_id: {
      type: DataTypes.STRING
    },
    device_token: {
      type: DataTypes.STRING
    },
    profile_photo: {
      type: DataTypes.STRING
    }
  });

  return User;
};
