const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId,
    { Chapter } = require('../enums');

const ChapterSchema = new Schema(
    {
        subcategory: {
            type: ObjectId,
            ref: 'SubCategory',
            required: true,
        },
        name: {
            type: String,
            trim: true,
            required: true,
        },
        subHeading: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        keywords: {
            type: Array,
            default: [],
        },
        type: {
            type: String,
            enum: [...Object.keys(Chapter)],
        },
        meta_tags: {
            type: String,
            get: (data) => {
                try {
                    return JSON.parse(data);
                } catch (error) {
                    return data;
                }
            },
            set: (data) => {
                return JSON.stringify(data);
            },
        },
        meta_keywords: {
            type: String,
            get: (data) => {
                try {
                    return JSON.parse(data);
                } catch (error) {
                    return data;
                }
            },
            set: (data) => {
                return JSON.stringify(data);
            },
        },
        showInOverview: {
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

ChapterSchema.index({ name: 'text', subHeading: 'text', keywords: 'text' });
module.exports = mongoose.model('Chapter', ChapterSchema);
