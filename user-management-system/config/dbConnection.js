const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.HOST,
    dialect: 'mssql',
    port: process.env.DATABASE_PORT,
    dialectOptions: {
      // Observe the need for this nested `options` field for MSSQL
      options: {
        // Your tedious options here
        useUTC: false,
        dateFirst: 1
      }
    }
  }
);

sequelize
  .authenticate()
  .then(() => console.log('Database authenticated 😃✨'))
  .catch((err) => console.log('Unable to connect: ', err));

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;
db.QueryTypes = QueryTypes;

// import master model
db.Admin = require('../model/admin.model')(sequelize, DataTypes);
db.Group = require('../model/group.model')(sequelize, DataTypes);
db.Role = require('../model/role.model')(sequelize, DataTypes);
db.Permission = require('../model/permission.model')(sequelize, DataTypes);
db.RolePermission = require('../model/rolePermission.model')(
  sequelize,
  DataTypes
);
db.PasswordReset = require('../model/passwordReset.model')(
  sequelize,
  DataTypes
);
db.User = require('../model/user.model')(sequelize, DataTypes);
db.Address = require('../model/userAddress.model')(sequelize, DataTypes);
db.UserToken = require('../model/userToken.model')(sequelize, DataTypes);
db.Lead = require('../model/lead.model')(sequelize, DataTypes);
db.UserBankDetail = require('../model/userBankDetail.model')(
  sequelize,
  DataTypes
);

// relationship

module.exports = db;
