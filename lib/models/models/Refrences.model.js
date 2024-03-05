const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const RefrencesSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        link: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
            default: 'home/link.png',
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
RefrencesSchema.index({ name: 'text' });
module.exports = mongoose.model('Refrences', RefrencesSchema);
