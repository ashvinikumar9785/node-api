const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const VideoSchema = new Schema({
    name: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    url: {
        type: String,
        trim: true,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
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


module.exports = mongoose.model('Video', VideoSchema);
