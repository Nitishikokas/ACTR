const createError = require('http-errors');
const db = require('../../config/dbConnection');

const { Admin, Group, Role, Permission, RolePermission } = db;
const { Op, QueryTypes, sequelize } = db;

const whoAmI = (req, res, next) => {
  res.send('this is admin route');
};

const addAdminGroup = async (req, res, next) => {
  try {
    const { name } = req.body;

    // check for the required fields.
    if (!name) throw createError.BadRequest(`Name is required`);

    // Check if Group already exist
    const group = await Group.findOne({
      where: { name: name.toLowerCase() }
    });

    if (group) {
      throw createError.Conflict(`Group '${name}' already found.`);
    }

    const newGroup = await Group.create({
      name: name.toLowerCase()
    });

    res.send({
      message: 'Group created successfully',
      data: newGroup,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminGroup = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    // check for the required fields.
    if (!name) throw createError.BadRequest(`Name is required`);
    if (!id) throw createError.BadRequest(`Id is required`);

    // Check if Group already exist
    const group = await Group.findOne({
      where: { id }
    });

    if (!group) {
      throw createError.Conflict(`Group not found by id: '${id}'`);
    }

    // Update Group
    const [saved] = await Group.update(
      { name: name.toLowerCase() },
      { where: { id: group.id } }
    );

    if (!saved)
      throw createError.InternalServerError('Error while saving group.');

    res.send({
      message: 'Group updated successfully',
      data: saved,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getAdminGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    let groups;

    if (id) {
      groups = await Group.findOne({
        where: { id }
      });
    } else {
      groups = await Group.findAll();
    }

    if (!groups) {
      throw createError.Conflict(`Group not found by id: '${id}'`);
    }

    res.send({
      message: 'Groups',
      data: groups,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const addAdminPermission = async (req, res, next) => {
  try {
    const { name } = req.body;

    // check for the required fields.
    if (!name) throw createError.BadRequest(`Name is required`);

    // Check if permission already exist
    const permission = await Permission.findOne({
      where: { name: name.toLowerCase() }
    });

    if (permission) {
      throw createError.Conflict(`Permission '${name}' already found.`);
    }

    const newPermission = await Permission.create({
      name: name.toLowerCase()
    });

    res.send({
      message: 'Permission created successfully',
      data: newPermission,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminPermission = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    // check for the required fields.
    if (!name) throw createError.BadRequest(`Name is required`);
    if (!id) throw createError.BadRequest(`Id is required`);

    // Check if Group already exist
    const permission = await Permission.findOne({
      where: { id }
    });

    if (!permission) {
      throw createError.Conflict(`Permission not found by id: '${id}'`);
    }

    // Update Permission
    const [saved] = await Permission.update(
      { name: name.toLowerCase() },
      { where: { id: permission.id } }
    );

    if (!saved)
      throw createError.InternalServerError('Error while saving permission.');

    res.send({
      message: 'Permission updated successfully',
      data: saved,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getAdminPermission = async (req, res, next) => {
  try {
    const { id } = req.params;

    let permission;

    if (id) {
      permission = await Permission.findOne({
        where: { id }
      });
    } else {
      permission = await Permission.findAll();
    }

    if (!permission) {
      throw createError.Conflict(`Permission not found by id: '${id}'`);
    }

    res.send({
      message: 'Permissions',
      data: permission,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const addAdminRole = async (req, res, next) => {
  try {
    const { name, permission, role_menu } = req.body;

    console.log(permission);

    // check for the required fields.
    if (!name) throw createError.BadRequest(`Name is required`);

    // Check if Group already exist
    const role = await Role.findOne({
      where: { name: name.toLowerCase() }
    });

    if (role) {
      throw createError.Conflict(`Role '${name}' already found.`);
    }

    const newRole = await Role.create({
      name: name.toLowerCase(),
      role_menu
    });

    if (permission && permission.length > 0) {
      let dataArr = [];
      permission.forEach((element) => {
        let obj = {
          role_id: newRole.id,
          permission_id: element
        };
        dataArr.push(obj);
      });
      // Insert Role and Permission to 'role_permission' table

      const entries = await RolePermission.bulkCreate(dataArr);
      // check if all entry done successfully
      if (entries.length !== permission.length)
        throw createError.InternalServerError(
          `All Permissions not updated to this role. Please try updating this role.`
        );
    }

    res.send({
      message: 'Role created successfully',
      data: newRole,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminRole = async (req, res, next) => {
  try {
    const { name, permission, role_menu } = req.body;
    const { id } = req.params;

    if (!name && !role_menu)
      throw createError.BadRequest(`Please provide data to update`);

    // check for the required fields.
    if (!id) throw createError.BadRequest(`Id is required`);

    // Check if Group already exist
    const role = await Role.findOne({
      where: { id }
    });

    if (!role) {
      throw createError.Conflict(`Role not found by id: '${id}'`);
    }

    let updateData = {};

    if (name) {
      updateData.name = name.toLowerCase();
    }
    if (role_menu) {
      updateData.role_menu = role_menu;
    }

    // Update Role
    const [saved] = await Role.update(updateData, { where: { id: id } });

    if (!saved)
      throw createError.InternalServerError('Error while updating role.');

    if (permission && permission.length > 0) {
      // Delete previous permissions
      await RolePermission.destroy({
        where: {
          role_id: id
        }
      });

      // prepare data to insert
      let dataArr = [];
      permission.forEach((element) => {
        let obj = {
          role_id: id,
          permission_id: element
        };
        dataArr.push(obj);
      });

      // Insert Role and Permission to 'role_permission' table
      const entries = await RolePermission.bulkCreate(dataArr);

      // check if all entry done successfully
      if (entries.length !== permission.length)
        throw createError.InternalServerError(
          `All Permissions not updated to this role. Please try updating this role.`
        );
    }

    res.send({
      message: 'Role updated successfully',
      data: saved,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

const getAdminRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    let roles;

    if (id) {
      roles = await Role.findOne({
        where: { id }
      });
      if (roles) roles = [roles];
    } else {
      roles = await Role.findAll();
    }

    if (!roles) {
      throw createError.Conflict(`Role not found by id: '${id}'`);
    }

    // Raw Query
    async function getRolePermissions(roleId) {
      const query = `
        SELECT 
          rp.*, 
          p.name AS permission_name 
        FROM role_permissions AS rp 
        JOIN permissions AS p ON rp.permission_id = p.id 
        WHERE rp.role_id = ?
      `;

      const permissions = await sequelize.query(query, {
        replacements: [roleId],
        type: QueryTypes.SELECT
      });

      return permissions;
    }

    if (roles && roles.length > 0) {
      for (let k = 0; k < roles.length; k++) {
        const permissions = await getRolePermissions(roles[k].id);
        if (permissions.length > 0) {
          roles[k] = JSON.parse(JSON.stringify(roles[k]));
          roles[k].permission = permissions;
        }
      }
    }

    res.send({
      message: 'Roles',
      data: roles,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  whoAmI,
  addAdminGroup,
  updateAdminGroup,
  getAdminGroup,
  addAdminRole,
  updateAdminRole,
  getAdminRole,
  addAdminPermission,
  updateAdminPermission,
  getAdminPermission
};
