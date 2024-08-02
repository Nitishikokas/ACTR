const JWT = require('jsonwebtoken');
const createError = require('http-errors');

const db = require('../config/dbConnection');

const PasswordReset = db.PasswordReset;
const UserToken = db.UserToken;

module.exports = {
  // this function it is not a middleware
  signAccessToken: (user) => {
    return new Promise((resolve, reject) => {
      const payload = {
        audience: user.id.toString(),
        role: user.role,
        group: user.group
      };
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: '1d',
        issuer: 'SB',
        audience: user.id.toString()
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          return reject(createError.InternalServerError()); // Do not send Server Errors to the user.
        }
        resolve(token);
      });
    });
  },
  // this function it is not a middleware
  signRefreshToken: (user, status, isUser) => {
    // Note: isUser is only true for non Admins
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET;
      const options = {
        expiresIn: '1y',
        issuer: 'indi_cold',
        audience: user.id.toString()
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          // Do not send Server Errors to the user.
          return reject(createError.InternalServerError());
        }

        // Save token to the db
        if (!isUser) {
          // for Admins
          const dataObj = {
            email: user.email,
            user_id: user.id,
            token,
            status
          };

          PasswordReset.create(dataObj)
            .then((res) => {
              resolve(token);
            })
            .catch((err) => {
              console.log(err.message);
              reject(createError.InternalServerError());
              return;
            });
        } else {
          // for users
          const dataObj = {
            mobile: user.mobile,
            user_id: user.id,
            token,
            status
          };

          UserToken.create(dataObj)
            .then((res) => {
              resolve(token);
            })
            .catch((err) => {
              console.log(err.message);
              reject(createError.InternalServerError());
              return;
            });
        }
      });
    });
  },
  // this is a middleware to verify an access token
  verifyAccessToken: (req, res, next) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized());

    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader.split(' ');
    const token = bearerToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  verifyRefreshToken: (refreshToken, isUser) => {
    // Note: isUser is only true for non Admins
    return new Promise((resolve, reject) => {
      console.log(refreshToken);
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized());

          // Get userId from the refresh token
          //console.log({ payload });
          const userId = payload.aud;

          // Check if UserId is present in the DB
          if (!isUser) {
            // For Admins
            PasswordReset.findOne({ where: { token: refreshToken } })
              .then((result) => {
                if (refreshToken === result.token)
                  return resolve(parseInt(userId));
                reject(createError.Unauthorized());
              })
              .catch((err) => {
                if (err) {
                  console.log(err.message);
                  reject(createError.InternalServerError());
                  return;
                }
              });
            //resolve(userId);
          } else {
            // For users
            UserToken.findOne({ where: { token: refreshToken } })
              .then((result) => {
                if (refreshToken === result.token)
                  return resolve(parseInt(userId));
                reject(createError.Unauthorized());
              })
              .catch((err) => {
                if (err) {
                  console.log(err.message);
                  reject(createError.InternalServerError());
                  return;
                }
              });
          }
        }
      );
    });
  },

  getForgotPasswordResetLink: (user) => {
    return new Promise((resolve, reject) => {
      const secret = process.env.PASSWORD_RESET_SECRET + user.password;
      const payload = {
        email: user.email,
        id: user.id
      };
      const options = { expiresIn: '15m' };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          return reject(createError.InternalServerError()); // Do not send Server Errors to the user.
        }
        const link = `${process.env.PASSWORD_RESET_URL}/${user.id}/${token}`;
        resolve(link);
      });
    });
  },

  verifyForgotPasswordToken: (password, token) => {
    try {
      const secret = process.env.PASSWORD_RESET_SECRET + password;

      let result = JWT.verify(token, secret, (err, payload) => {
        if (err) {
          return false;
        }
        return true;
      });
      return result;
    } catch (error) {
      console.log(error);
    }
  }
};
