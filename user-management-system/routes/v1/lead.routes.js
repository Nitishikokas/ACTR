const LeadController = require('../../controller/v1/lead.controller');
const { verifyAccessToken } = require('../../utils/jwtHelper');

const express = require('express');
const router = express.Router();

let routes = (app) => {
  // router.get('/', AdminACLController.whoAmI);
  router.post('/leads', verifyAccessToken, LeadController.saveLeads);
  router.put('/leads/:id', verifyAccessToken, LeadController.updateLeads);
  router.get('/leads', verifyAccessToken, LeadController.getLeads);

  return app.use('/api/v1/user/lead', router);
};

//module.exports = router;
module.exports = routes;
