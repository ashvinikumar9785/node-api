const locale = {
    GENERAL_ERROR: 'An error occurred.',
    ADD_ENQUIRY: 'Your enquiry has been submitted sucessfully'
};

const validationKeys = {

};

const key = keyName => validationKeys[keyName.replace(/\.[\d]+/, '')] || keyName;

/**
 * @see https://github.com/hapijs/joi/blob/master/lib/language.js
 */
const validationMessages = {

};

locale.validationKeys = validationKeys;
locale.validation = validationMessages;

module.exports = Object.freeze(locale);
