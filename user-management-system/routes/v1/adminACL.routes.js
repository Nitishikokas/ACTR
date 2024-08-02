const AdminACLController = require('../../controller/v1/adminACL.controller');
const { verifyAccessToken } = require('../../utils/jwtHelper');

const express = require('express');
const router = express.Router();

let routes = (app) => {
  router.get('/', AdminACLController.whoAmI);
  router.post('/groups', verifyAccessToken, AdminACLController.addAdminGroup);
  router.put(
    '/groups/:id',
    verifyAccessToken,
    AdminACLController.updateAdminGroup
  );
  router.get(
    '/groups/:id?',
    verifyAccessToken,
    AdminACLController.getAdminGroup
  );
  router.post('/roles', verifyAccessToken, AdminACLController.addAdminRole);
  router.put(
    '/roles/:id',
    verifyAccessToken,
    AdminACLController.updateAdminRole
  );
  router.get('/roles/:id?', verifyAccessToken, AdminACLController.getAdminRole);
  router.post(
    '/permissions',
    verifyAccessToken,
    AdminACLController.addAdminPermission
  );
  router.put(
    '/permissions/:id',
    verifyAccessToken,
    AdminACLController.updateAdminPermission
  );
  router.get(
    '/permissions/:id?',
    verifyAccessToken,
    AdminACLController.getAdminPermission
  );

  return app.use('/api/v1/admin/acl', router);
};

//module.exports = router;
module.exports = routes;
