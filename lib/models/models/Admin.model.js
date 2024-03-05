const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  bcrypt = require('bcrypt');
// { SignUpThrough } = require('../enums');

const AdminSchema = new Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    password: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: null,
    },
    deviceToken: {
      type: String,
      trim: true,
    },
    TokenIssuedAt: Number,
    resetTokenIssuedAt: Number,
    resetToken: String, // to store invite
    isEmailVerify: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated',
    },
    id: false,
    toJSON: {
      getters: true,
    },
    toObject: {
      getters: true,
    },
  }
);

AdminSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
      next();
    } catch (e) {
      next(e);
    }
  } else if (user.isModified('countryCode') || user.isModified('phone')) {
    try {
      user.formattedPhone = `${user.countryCode}${user.phone}`;
      next();
    } catch (e) {
      next(e);
    }
  } else {
    return next();
  }
});

AdminSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (e) {
    return false;
  }
};

module.exports = mongoose.model('Admin', AdminSchema);
