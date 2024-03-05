const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const CategorySchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        showinDecision: {
            type: Boolean,
            default: false,
        },
        showinClassification: {
            type: Boolean,
            default: false,
        },
        showinGuidline: {
            type: Boolean,
            default: false,
        },
        showinAntibiotic: {
            type: Boolean,
            default: false,
        },
        showinOverview: {
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
        toJSON: {
            getters: true,
        },
        toObject: {
            getters: true,
        },
    }
);

module.exports = mongoose.model('Category', CategorySchema);
