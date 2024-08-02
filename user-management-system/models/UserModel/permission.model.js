module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('permission', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Permission;
};
