const { exec } = require('child_process');
var express = require('express');
const path = require('path');
var router = express.Router();
const fs = require('fs');
const fsext = require('fs-extra');
const archiver = require('archiver');

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.post('/execute-command', (req, res) => {
  const { appname, technology, database, schema } = req.body;
  console.log(appname, technology, database, schema);
  const command = `
  npx express-generator ${appname} &&
  cd ${appname} &&
  npm install &&
  npm install express-handlebars sequelize sequelize-cli mysql2 dotenv bcrypt &&
  npx sequelize-cli init &&
  npx sequelize-cli model:generate --name User --attributes name:string,email:string,password:string &&
  npx sequelize-cli
  `.replace(/\n/g, ' ');

  console.log("Executing command:", command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error);
      res.status(500).json('Project setup failed.');
      return;
    }
    res.status(200).json('Project setup completed successfully.');
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
  });
});

router.post('/setup-project', (req, res) => {
  const { appname, technology, database, schema } = req.body;
  const pathroot = `../../user-management-system/${appname}`;
  const rootPath = path.join(__dirname, pathroot);

  const sourceDestinationPairs = [
    { source: '../views/email', destination: `${appname}/views/email` },
    { source: '../views/sms', destination: `${appname}/views/sms` },
    { source: '../services', destination: `${appname}/services` },
    { source: '../models/UserModel', destination: `${appname}/model` },
    { source: '../config', destination: `${appname}/config` },
    { source: '../middleware', destination: `${appname}/middleware` },
    { source: '../routes/v1', destination: `${appname}/routes/v1` },
    { source: '../utils', destination: `${appname}/utils` },
    { source: '../controller', destination: `${appname}/controller` },
    { source: '../.env', destination: `${appname}/.env` },
    { source: '../extra/app.js', destination: `${appname}/app.js` },
    { source: '../extra/package.json', destination: `${appname}/package.json` }
  ];

  try {
    sourceDestinationPairs.forEach(pair => {
      fsext.copySync(path.join(__dirname, pair.source), path.join(__dirname, '..', pair.destination), { recursive: true });
    });

    fs.mkdirSync(path.join(rootPath, 'controllers'));
    fs.mkdirSync(path.join(rootPath, 'connection'));
    fs.mkdirSync(path.join(rootPath, 'models'));

    fs.writeFileSync(path.join(rootPath, 'controllers/userController.js'), generateUserController());
    fs.writeFileSync(path.join(rootPath, 'connection/db.js'), generateDatabaseConnection());
    fs.writeFileSync(path.join(rootPath, 'models/User.js'), generateUserModel());

    res.json({ message: 'Project setup commands executed successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.post('/remove-project', async (req, res) => {
  const { appname, technology, database, schema } = req.body;
  const pathroot = `../../user-management-system/${appname}`;
  const rootPath = path.join(__dirname, pathroot);

  try {
    await fsext.remove(rootPath);
    res.json({ message: 'Project directory removed successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.get('/download-folder', (req, res) => {
  const folderPath = path.join(__dirname, '../../user-management-system/user-management-system');
  const zipFileName = 'folder.zip';

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(folderPath, false);
  archive.finalize();

  res.attachment(zipFileName);
  res.contentType('application/zip');
});

router.get('/download-folder-mongo', (req, res) => {
  const folderPath = path.join(__dirname, '../../user-management-system/MongoProject');
  const zipFileName = 'folder.zip';

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(folderPath, false);
  archive.finalize();

  res.attachment(zipFileName);
  res.contentType('application/zip');
});

function generateUserController() {
  return `
    const { User } = require('../models');

    module.exports = {
      getUsers: async (req, res) => {
        try {
          const users = await User.findAll();
          res.json(users);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Server Error' });
        }
      },
    };
  `;
}

function generateDatabaseConnection() {
  return `
    const { Sequelize } = require('sequelize');
    const dotenv = require('dotenv');
    dotenv.config();

    const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      dialect: 'mysql',
    });

    (async () => {
      try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }
    })();

    module.exports = sequelize;
  `;
}

function generateUserModel() {
  return `
    const { DataTypes } = require('sequelize');
    const sequelize = require('../connection/db');

    const User = sequelize.define('User', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });

    module.exports = User;
  `;
}

module.exports = router;
