const AdminController = require('../../controller/v1/admin.controller');

const express = require('express');
const router = express.Router();

let routes = (app) => {
  router.get('/', AdminController.whoAmI);
  router.post('/signup', AdminController.adminSignup);
  router.post('/login', AdminController.adminLogin);
  router.post('/token', AdminController.getAccessTokenByRefreshToken);
  router.post('/forgot-password', AdminController.forgotPassword);
  router.get('/reset-password/:id/:token', AdminController.getResetPassword);
  router.post('/reset-password/:id/:token', AdminController.saveResetPassword);

  return app.use('/api/v1/admin', router);
};

//module.exports = router;
module.exports = routes;
