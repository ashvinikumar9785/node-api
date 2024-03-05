const {
    models: { Admin },
} = require('../../../../lib/models');
const { utcDateTime } = require('../../../../lib/util');
const { signToken } = require('../../utils/auth');
const { sendMail } = require('../../../../lib/mailer');
const _ = require('lodash'), jwt = require('jsonwebtoken');
const { getPlatform } = require('../../utils/common');


const jwt_secret = process.env.JWT_SECRET;
const jwt_expire = process.env.JWT_EXPIRE;

//------------------------------------------------------- Social Login
const googleAuth = require('./social/google-auth');
const facebookAuth = require('./social/facebook-auth');
const appleAuth = require('./social/apple-auth');

class AuthController {

    async createAccount(req, res) {
        try {

            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { fullName, email, password, signUpThrough } = params;
            //check user already exists or not
            const userMatchCond = {
                $or: [{ $and: [{ email }] }],
                isDeleted: false,
            };
            let user = await Admin.findOne(userMatchCond);
            if (user) {
                return res.warn(null, req.__('USER_ALREADY_FOUND'));
            }

            // register new user
            const userData = { fullName, email, password, signUpThrough };
            user = new Admin(userData);
            user.authTokenIssuedAt = utcDateTime().valueOf();
            await user.save();
            const platform = getPlatform(req);
            const token = signToken(user, platform);
            const userJson = user.toJSON();
            ['password', 'authTokenIssuedAt', 'failedLoginAttempts', 'preventLoginTill', 'social', '__v'].forEach(
                key => delete userJson[key]
            );

            return res.success({ token, user: userJson }, req.__('REGISTER_SUCCESS'));

        } catch (error) {
            console.log('Create Account Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async login(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { email, password, deviceToken } = params;

            let user = await Admin.findOne({ email, isDeleted: false });


            if (!user) {
                return res.warn(null, req.__('USER_NOT_FOUND'));
            }
            if (user.isSuspended) {
                return res.warn(null, req.__('YOUR_ACCOUNT_SUSPENDED'));
            }

            //if failed login attempts is greater that equal to allowed failed login attempts then check preventLoginTill
            if (user.failedLoginAttempts >= parseInt(process.env.ALLOWED_FAILED_LOGIN_ATTEMPTS || 3)) {
                let difference = user.preventLoginTill - utcDateTime().valueOf();
                if (difference > 0) {
                    let differenceInSec = Math.abs(difference) / 1000;
                    differenceInSec -= Math.floor(differenceInSec / 86400) * 86400;
                    differenceInSec -= (Math.floor(differenceInSec / 3600) % 24) * 3600;
                    const minutes = Math.floor(differenceInSec / 60) % 60;
                    differenceInSec -= minutes * 60;
                    const seconds = differenceInSec % 60;
                    return res.warn(
                        null,
                        req.__(
                            'LOGIN_DISABLED',
                            `${minutes ? `${minutes} ${req.__('KEY_MINUTES')} ` : ''}${seconds} ${req.__(
                                'KEY_SECONDS'
                            )}`
                        )
                    );
                }
            }
            //match password condition
            const passwordMatched = await user.comparePassword(password);
            if (!passwordMatched) {
                user.failedLoginAttempts = user.failedLoginAttempts + 1;
                user.preventLoginTill = utcDateTime(
                    utcDateTime().valueOf() + parseInt(process.env.PREVENT_LOGIN_ON_FAILED_ATTEMPTS_TILL || 5) * 60000
                ).valueOf();
                await user.save();
                const chanceLeft = parseInt(process.env.ALLOWED_FAILED_LOGIN_ATTEMPTS || 3) - user.failedLoginAttempts;
                return res.warn(
                    null,
                    req.__(
                        'INVALID_CREDENTIALS_LIMIT',
                        `${chanceLeft <= 0
                            ? `${req.__('KEY_LOGIN_DISABLED')}`
                            : `${req.__('KEY_YOU_HAVE_ONLY')} ${chanceLeft} ${req.__('KEY_CHANCE_LEFT')}`
                        }`
                    )
                );
            }


            deviceToken && (user.deviceToken = deviceToken);
            user.authTokenIssuedAt = utcDateTime().valueOf();
            user.failedLoginAttempts = 0;
            user.preventLoginTill = 0;
            await user.save();

            const platform = getPlatform(req);
            const token = signToken(user, platform);
            const userJson = user.toJSON();
            ['password', 'authTokenIssuedAt', 'failedLoginAttempts', 'preventLoginTill', 'social', '__v'].forEach(
                key => delete userJson[key]
            );
            return res.success({ token, user: userJson }, req.__('LOGIN_SUCCESS'));
        } catch (error) {
            console.log('Login Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async forgotPassword(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { email } = params;

            let user = await Admin.findOne({ email, isDeleted: false, isSuspended: false });

            if (!user) {
                return res.warn(null, req.__('USER_NOT_FOUND'));
            }
            if (user.isSuspended) {
                return res.warn(null, req.__('YOUR_ACCOUNT_SUSPENDED'));
            }
            const payload = { id: user._id, email };
            const encrypted = jwt.sign(payload, jwt_secret, {
                expiresIn: jwt_expire,
            });
            user.resetToken = encrypted;
            user.resetTokenIssuedAt = new Date();
            await user.save();

            sendMail('forgot-password', 'Forgot Password Mail', email, {
                reset_link: encrypted,
            }).catch((error) => {
                console.log(`Failed to email to ${email} `);
                console.log(error);
            });
            return res.success(null, req.__('RESET_EMAIL'));
        } catch (error) {
            console.log('Forgot Password Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async verifyOTP(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { token } = params;
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err || !decoded || !decoded.id) {
                    return res.unauthorized(null, req.__('UNAUTHORIZED'));
                }

                const user = await Admin.findOne({
                    _id: decoded.id,
                    email: decoded.email,
                });

                if (user) {
                    return res.success({ isValid: true }, req.__('VALID_TOKEN'));
                } else {
                    return res.success({ isValid: false }, req.__('INVALID_TOKEN'));
                }

            })
        } catch (error) {
            console.log('Verify OTP Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async resetPassword(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { token } = params;
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err || !decoded || !decoded.id) {
                    return res.unauthorized(null, req.__('UNAUTHORIZED'));
                }

            })
        } catch (error) {
            console.log('Verify OTP Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    /*Social login start */
    async socialLogIn(req, res) {
        const { socialPlatform, accessToken, deviceToken } = req.body;

        let userSocialInfo = {};
        if (socialPlatform === 'GOOGLE') {
            try {
                userSocialInfo = await googleAuth.getGoogleUser(accessToken);
            } catch (error) {
                console.log('+++error', error);
                return res.warn(null, 'Unable to validate user social info');
            }
        } else if (socialPlatform === 'FACEBOOK') {
            try {
                userSocialInfo = await facebookAuth.getUser(accessToken);
            } catch (error) {
                return res.warn(null, 'Unable to validate user social info');
            }
        } else if (socialPlatform === 'APPLE') {
            try {
                let appleInfo = await appleAuth.getAppleUserId(accessToken);
                userSocialInfo = { id: appleInfo.sub, email: appleInfo.email };
            } catch (error) {
                return res.warn(null, 'Unable to validate user social info');
            }
        }

        if (userSocialInfo) {
            let user = await Admin.findOne({
                social: { $elemMatch: { socialId: userSocialInfo.id, socialPlatform } },
                isDeleted: false,
            });

            //if user not logged in previously than match email id
            if (!user) {
                user = (await Admin.findOne({ email: userSocialInfo.email, isDeleted: false })) || new Admin();
            }

            //if user found
            if (user && user.isSuspended) {
                return res.warn(null, req.__('YOUR_ACCOUNT_SUSPENDED'));
            }

            userSocialInfo.email && (user.email = userSocialInfo.email);
            userSocialInfo.name && (user.fullName = userSocialInfo.name);
            //if social plateform available then don't push otherwise push
            !user.social.some(obj => obj.socialPlatform === socialPlatform)
                ? user.social.push({ socialId: userSocialInfo.id, socialPlatform })
                : '';
            deviceToken && (user.deviceToken = deviceToken);
            user.authTokenIssuedAt = utcDateTime().valueOf();
            await user.save();
            const platform = getPlatform(req);
            const token = signToken(user, platform);
            const userJson = user.toJSON();
            ['password', 'authTokenIssuedAt', 'failedLoginAttempts', 'preventLoginTill', 'social', '__v'].forEach(
                key => delete userJson[key]
            );

            return res.success(
                {
                    token,
                    user: userJson,
                },
                req.__('LOGIN_SUCCESS')
            );
        } else {
            return res.warn(null, 'Unable to validate user social info');
        }
    }


    async socialLogInWithoutVerify(req, res) {
        try {
            const { socialPlatform, socialId, socialFullName, socialEmail, deviceToken } = req.body;
            let user = await Admin.findOne({
                social: { $elemMatch: { socialId, socialPlatform } },
                isDeleted: false,
            });

            //if user not logged in previously than match email id
            if (!user) {
                user = (await Admin.findOne({ email: socialEmail, isDeleted: false })) || new Admin();
            }

            //if user found
            if (user && user.isSuspended) {
                return res.warn(null, req.__('YOUR_ACCOUNT_SUSPENDED'));
            }

            socialEmail && (user.email = socialEmail);
            socialFullName && (user.fullName = socialFullName);
            //if social plateform available then don't push otherwise push
            !user.social.some(obj => obj.socialPlatform === socialPlatform)
                ? user.social.push({ socialId, socialPlatform })
                : '';
            deviceToken && (user.deviceToken = deviceToken);
            user.authTokenIssuedAt = utcDateTime().valueOf();
            await user.save();
            const platform = getPlatform(req);
            const token = signToken(user, platform);
            const userJson = user.toJSON();
            ['password', 'authTokenIssuedAt', 'failedLoginAttempts', 'preventLoginTill', 'social', '__v'].forEach(
                key => delete userJson[key]
            );

            return res.success(
                {
                    token,
                    user: userJson,
                },
                req.__('LOGIN_SUCCESS')
            );
        } catch (e) {
            console.log('err===>', e);
            return res.serverError({}, req.__('GENERAL_ERROR'), e);
        }
    }
    /*Social login end */


    async logout(req, res) {
        try {
            const { user } = req;
            user.authTokenIssuedAt = null;
            user.deviceToken = null;
            await user.save();
            return res.success(null, req.__('LOGOUT_SUCCESS'));
        } catch (error) {
            console.log('Logout Error', error);
            return res.serverError({}, req.__('GENERAL_ERROR'));
        }
    }

    async updateProfile(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { _id, fullName } = params;
            const adminDetail = await Admin.findOne({ _id });
            if (adminDetail) {
                adminDetail.fullName = fullName;
            }
            if (req.file) {
                adminDetail.avatar = `${req.file.originalname}`;
                adminDetail.image = `${req.file.originalname}`;
            }
            await adminDetail.save();
            return res.success(adminDetail, req.__('PROFILE_UPDATED'));
        } catch (error) {
            console.log('Logout Error', error);
            return res.serverError({}, req.__('GENERAL_ERROR'));
        }
    }

    async changePassword(req, res,) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { _id } = req.user;
            const { oldPassword, newPassword } = params;
            let adminDetail = await Admin.findOne({ _id });
            const matchPassword = await adminDetail.comparePassword(oldPassword);
            if (!matchPassword) {
                return res.warn({}, req.__('PASSWORD_MISMATCHED'));
            }
            adminDetail.password = newPassword;
            await adminDetail.save();
            return res.success({ updated: true }, req.__('PASSWORD_UPDATED'));
        } catch (error) {
            console.log('Reset Password Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }
}

module.exports = new AuthController();