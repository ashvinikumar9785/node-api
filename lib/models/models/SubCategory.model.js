const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

const SubCategorySchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
            default: '',
        },
        category: {
            type: ObjectId,
            ref: 'Category',
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
        parent: {
            type: ObjectId,
            ref: 'SubCategory',
        },
        children: {
            type: ObjectId,
            ref: 'SubCategory',
        }
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

module.exports = mongoose.model('SubCategory', SubCategorySchema);
