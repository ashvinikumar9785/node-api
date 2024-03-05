const jwt = require('jsonwebtoken');
const {
    models: { Admin },
} = require('./../../../lib/models');
const { getPlatform } = require('./common');
const { withLanguage } = require('./../../../lib/i18n');

const signToken = (user, platform) => {
    const payload = {
        sub: user._id,
        iat: user.authTokenIssuedAt,
        aud: platform,
    };
    return jwt.sign(payload, process.env.JWT_SECRET);
};

const verifyToken = (req, res, next) =>
    jwt.verify(req.headers.authorization, process.env.JWT_SECRET, async (err, decoded) => {
        const platform = getPlatform(req);
        if (err || !decoded || !decoded.sub || decoded.aud !== platform) {
            return res.unauthorized('', req.__('UNAUTHORIZED'));
        }

        const user = await Admin.findOne({
            _id: decoded.sub,
            isDeleted: false,
            // authTokenIssuedAt: decoded.iat,
        });

        if (!user) {
            return res.unauthorized('', req.__('UNAUTHORIZED'));
        }

        if (user.isSuspended) {
            return res.unauthorized('', req.__('YOUR_ACCOUNT_SUSPENDED'));
        }

        req.user = user;
        res.user = user;
        next();
    });

const verifyTokenOptional = (req, res, next) => {
    if (!(req.headers.authorization)) {
        req.user = null;
        res.user = null;
        next();
    }
    else {
        jwt.verify(req.headers.authorization, process.env.JWT_SECRET, async (err, decoded) => {
            const platform = getPlatform(req);
            if (err || !decoded || !decoded.sub || decoded.aud !== platform) {
                return res.unauthorized('', req.__('UNAUTHORIZED'));
            }

            const user = await Admin.findOne({
                _id: decoded.sub,
                isDeleted: false,
                authTokenIssuedAt: decoded.iat,
            });

            if (!user) {
                return res.unauthorized('', req.__('UNAUTHORIZED'));
            }

            if (user.isSuspended) {
                return res.unauthorized('', req.__('YOUR_ACCOUNT_SUSPENDED'));
            }

            req.user = user;
            res.user = user;
            next();
        });
    }
};

const verifyTokenSocket = (token, language = 'en') => jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    const __ = withLanguage(language);

    if (err || !decoded || !decoded.sub) {
        return {
            error: true,
            msg: __('UNAUTHORIZED'),
        };
    }

    const user = await Admin.findOne({
        _id: decoded.sub,
        isDeleted: false,
        authTokenIssuedAt: decoded.iat,
    });

    if (!user) {
        return {
            error: true,
            msg: __('UNAUTHORIZED'),
        };
    }

    if (user.isSuspended) {
        return {
            error: true,
            msg: __('YOUR_ACCOUNT_SUSPENDED'),
        };
    }

    return {
        error: false,
        data: {
            user,
        },
    };
});

module.exports = {
    signToken,
    verifyToken,
    verifyTokenOptional,
    verifyTokenSocket,
};
