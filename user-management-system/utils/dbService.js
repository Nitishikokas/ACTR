const db = require('../config/dbConnection');

// sync db
db.sequelize
  .sync({ alter: true })
  //.sync()
  .then(() => {
    console.log('Database synced 😁👍');
  })
  .catch((err) => console.log('Unable to connect to database: ', err));
