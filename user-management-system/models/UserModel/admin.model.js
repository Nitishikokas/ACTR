module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('admin', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_deleted: {
      type: DataTypes.INTEGER
    },
    is_deactivated: {
      type: DataTypes.INTEGER
    },
    role: {
      type: DataTypes.INTEGER
    },
    group: {
      type: DataTypes.INTEGER
    },
    reset_link_verify: {
      type: DataTypes.INTEGER
    },
    profile_photo: {
      type: DataTypes.STRING
    }
  });

  return Admin;
};
