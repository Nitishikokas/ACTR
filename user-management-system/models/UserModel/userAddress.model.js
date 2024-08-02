module.exports = (sequelize, DataTypes) => {
  const UserAddress = sequelize.define('user_address', {
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
    aadhar_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address_on_aadhar: {
      type: DataTypes.STRING,
      allowNull: false
    },
    current_address_as_permanent: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    current_house_no: {
      type: DataTypes.STRING
    },
    current_street_name: {
      type: DataTypes.STRING
    },
    current_pin_code: {
      type: DataTypes.STRING
    },
    current_city: {
      type: DataTypes.STRING
    },
    current_state: {
      type: DataTypes.STRING
    }
  });

  return UserAddress;
};
