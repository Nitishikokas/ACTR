const UserController = require('../../controller/v1/userAuth.controller');

const express = require('express');
const router = express.Router();

let routes = (app) => {
  //router.get('/', UserController.whoAmI);
  router.post('/get-otp', UserController.getOTP);
  router.put('/verify-otp', UserController.verifyOTP);
  router.post('/verify-aadhar', UserController.verifyAadhar);
  router.post('/token', UserController.getAccessTokenByRefreshToken);
  router.post('/get-login-otp', UserController.getLoginOTP);
  router.put('/verify-login-otp', UserController.verifyLoginOTP);
  router.post(
    '/save-address-contact',
    UserController.saveAddressAndContactDetails
  );

  return app.use('/api/v1/user', router);
};

//module.exports = router;
module.exports = routes;
