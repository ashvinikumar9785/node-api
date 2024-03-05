const { Joi, common } = require('../../utils/validations');
// const { SignUpThrough } = require('../../../../lib/models/enums');

// ------------------------------------------------------------------Auth
const signUp = Joi.object().keys({
    fullName: Joi.string().required(),
    email: common.email,
    password: Joi.string().trim().required(),
    // signUpThrough: Joi.string()
    // .valid(...Object.keys(SignUpThrough))
    // .required(),
});

const logIn = Joi.object().keys({
    email: common.email,
    password: Joi.string().trim().required(),
    remember: Joi.boolean().optional(),
});

const forgotPassword = Joi.object().keys({
    email: common.email,
    deviceToken: Joi.string().trim().optional(),
});

const socialLogIn = Joi.object().keys({
    // socialPlatform: Joi.string()
    // .trim()
    // .valid(Object.keys(SignUpThrough))
    // .required(),
    accessToken: Joi.string().trim().required(),
    deviceToken: Joi.string().trim().optional(),
});

const socialLogInWithoutVerify = Joi.object().keys({
    // socialPlatform: Joi.string()
    // .trim()
    // .valid(Object.keys(SignUpThrough))
    // .required(),
    socialId: Joi.string().trim().required(),
    socialFullName: Joi.string().trim().optional().allow(''),
    socialEmail: Joi.string().trim().optional().allow(''),
    deviceToken: Joi.string().trim().optional().allow(''),
});

// ------------------------------------------------------------------User

const updateProfile = Joi.object().keys({
    fullName: Joi.string().trim().required(),
    nickName: Joi.string().trim().required(),
    email: Joi.string().trim().lowercase().optional(),
    // countryCode: Joi.string().optional(),
    phone: Joi.string()
        // .regex(new RegExp(/^[0-9]+$/))
        .min(7)
        .max(15)
        .trim()
        .optional(),
    dob: Joi.string().optional(),
    avatar: Joi.optional().allow('', null),
    bio: Joi.string().trim().min(1).max(500).optional(),
    deviceToken: Joi.string().trim().optional(),
});

const guidline = Joi.object().keys({
    name: Joi.string().required(),
    // image: Joi.bin().required(),
});

const addCategory = Joi.object().keys({
    name: Joi.string().required(),
    showinAntibiotic: Joi.boolean().optional(),
    showinDecision: Joi.boolean().optional(),
    showinClassification: Joi.boolean().optional(),
    showinOverview: Joi.boolean().optional(),
    showinGuidline: Joi.boolean().optional(),
});

const updateCategory = Joi.object().keys({
    _id: Joi.objectId()
        .valid()
        .required(),
    name: Joi.string().required(),
    showinAntibiotic: Joi.boolean().optional(),
    showinDecision: Joi.boolean().optional(),
    showinClassification: Joi.boolean().optional(),
    showinOverview: Joi.boolean().optional(),
    showinGuidline: Joi.boolean().optional(),
});

const deleteVideo = Joi.object().keys({
    videoId: Joi.objectId()
        .valid()
        .required()
});

const addtoOverviewList = Joi.object().keys({
    overviewId: Joi.objectId()
        .valid()
        .required(),
    subchapterList: Joi.array().required()
});

module.exports = {
    signUp,
    logIn,
    socialLogIn,
    socialLogInWithoutVerify,
    forgotPassword,
    updateProfile,
    guidline,
    addCategory,
    deleteVideo,
    addtoOverviewList,
    updateCategory
};
