const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const EnquirySchema = new Schema({
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        default: null,
    },
    message: {
        type: String,
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false
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
        toJSON: {
            getters: true,
        },
        toObject: {
            getters: true,
        },
    }
);


module.exports = mongoose.model('Enquiry', EnquirySchema);
