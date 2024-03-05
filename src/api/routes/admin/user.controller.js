const {
    models: { Enquiry, Reference },
} = require('../../../../lib/models');
const _ = require('lodash');

class UserController {
    async getEnquiry(req, res) {
        try {
            const data = await Enquiry.find({ isDeleted: false, isSuspended: false }).sort({ created: -1 });
            return res.success(data, req.__('ENQUIRY_DATA'));

        } catch (error) {
            console.log('Enquiry Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    // async addRefrences(req, res) {
    //     try {
    //         const params = _.extend(req.query || {}, req.params || {}, req.body || {});
    //         const { name, link } = params;
    //         const data = await Reference.create({ name, link });
    //         return res.success(data, req.__('ENQUIRY_DATA'));

    //     } catch (error) {
    //         console.log('Refrences Error', error);
    //         return res.serverError(error, req.__('GENERAL_ERROR'));
    //     }
    // }
    async addRefrences(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const updatedReferences = params.references; // Assuming the updated data is in the request body

            // Ensure updatedReferences is an array
            if (!Array.isArray(updatedReferences)) {
                throw new Error('Invalid format for updatedReferences. Expected an array.');
            }

            // Fetch existing references from the database
            const existingReferences = await Reference.find({}, '_id');

            // Extract existing reference IDs
            const existingReferenceIds = existingReferences.map(ref => ref._id.toString());

            // Filter out references to be removed
            const referencesToRemove = existingReferenceIds.filter(id => !updatedReferences.some(ref => ref._id === id));

            // Remove references not present in the updated data
            await Reference.deleteMany({ _id: { $in: referencesToRemove } });

            // Update or create references from the updated data
            for (const updatedReference of updatedReferences) {
                if (updatedReference._id) {
                    // If the reference has an ID, update it
                    await Reference.findByIdAndUpdate(updatedReference._id, { $set: updatedReference });
                } else {
                    // If the reference does not have an ID, create a new one
                    await Reference.create(updatedReference);
                }
            }

            return res.success({}, req.__('REFERENCES_UPDATED'));
        } catch (error) {
            console.log('Update References Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }


}

module.exports = new UserController();