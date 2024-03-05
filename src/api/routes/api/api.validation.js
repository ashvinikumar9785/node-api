const { Joi, common } = require('../../utils/validations');

// ------------------------------------------------------------------Auth
const enquiry = Joi.object().keys({
  name: Joi.string().required(),
  email: common.email,
  message: Joi.string().trim().required(),
});

const home = Joi.object().keys({
  name: Joi.string().required(),
  // image: Joi.file().required(),
});

const staticPage = Joi.object().keys({
  type: Joi.string().required(),
});


const guidline = Joi.object().keys({
  name: Joi.string().required(),
  // image: Joi.bin().required(),
});


const search = Joi.object().keys({
  search: Joi.string().required(),
});


module.exports = {
  enquiry,
  home,
  staticPage,
  guidline,
  search
};
