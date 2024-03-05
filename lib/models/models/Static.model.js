const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId,
    { Static } = require('../enums');


const StaticSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: false,
            default: '',
        },
        meta_tags: {
            type: Array,
            default: [],
        },
        meta_keywords: {
            type: Array,
            default: [],
        },
        type: {
            type: String,
            enum: [...Object.keys(Static)],
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

StaticSchema.index({ name: 'text', subHeading: 'text', keywords: 'text' });
module.exports = mongoose.model('Static', StaticSchema);
