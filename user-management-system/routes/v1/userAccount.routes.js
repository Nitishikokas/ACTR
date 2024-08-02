const UserAccountController = require('../../controller/v1/userAccount.controller');
const { verifyAccessToken } = require('../../utils/jwtHelper');

const express = require('express');
const router = express.Router();

let routes = (app) => {
  // router.get('/', AdminACLController.whoAmI);
  router.post(
    '/bank-accounts',
    verifyAccessToken,
    UserAccountController.saveBankDetails
  );
  router.put(
    '/bank-accounts/:id',
    verifyAccessToken,
    UserAccountController.updateBankDetails
  );
  router.get(
    '/bank-accounts',
    verifyAccessToken,
    UserAccountController.getBankDetails
  );

  router.get(
    '/contact-details',
    verifyAccessToken,
    UserAccountController.getContactDetails
  );

  router.get(
    '/address-details',
    verifyAccessToken,
    UserAccountController.getAddressDetails
  );
  // router.post('/roles', verifyAccessToken, AdminACLController.addAdminRole);
  // router.put(
  //   '/roles/:id',
  //   verifyAccessToken,
  //   AdminACLController.updateAdminRole
  // );
  // router.get('/roles/:id?', verifyAccessToken, AdminACLController.getAdminRole);
  // router.post(
  //   '/permissions',
  //   verifyAccessToken,
  //   AdminACLController.addAdminPermission
  // );
  // router.put(
  //   '/permissions/:id',
  //   verifyAccessToken,
  //   AdminACLController.updateAdminPermission
  // );
  // router.get(
  //   '/permissions/:id?',
  //   verifyAccessToken,
  //   AdminACLController.getAdminPermission
  // );

  return app.use('/api/v1/user/account', router);
};

//module.exports = router;
module.exports = routes;
