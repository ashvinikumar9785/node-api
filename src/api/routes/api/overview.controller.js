const {
    models: { Chapter, Category, SubCategory },
} = require('../../../../lib/models');
const _ = require('lodash');
const path = require('path');



async function getChaptersRecursively(subcategoryId) {
    const subcategory = await SubCategory.findById(subcategoryId);
    console.log('subcategory', subcategory);
    if (!subcategory || subcategory.isDeleted || subcategory.isSuspended) {
        return [];
    }

    const chapters = await Chapter.find({
        subcategory: subcategoryId,
        isDeleted: false,
        isSuspended: false,
        // showInOverview: true  // Uncomment if needed
    });


    const childSubcategories = await SubCategory.find({
        parent: subcategoryId,
        isDeleted: false,
        isSuspended: false,
        // showInOverview: true,
    });

    return [...chapters, ...childSubcategories];
}

class OverviewController {
    async getOverview(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            let { pagination, skip = 0, limit = process.env.MAX_LIMIT } = params;
            let response = {};

            skip = typeof skip === 'string' ? parseInt(skip) : skip;
            limit = typeof limit === 'string' ? parseInt(limit) : limit;

            // Match stage to filter documents (if needed)
            const commonStage = [
                {
                    $match: {
                        showinOverview: true,
                        isDeleted: false,
                        isSuspended: false,
                    },
                },
                {
                    $project: {
                        showinDecision: 0,
                        showinClassification: 0,
                        showinGuidline: 0,
                        showinAntibiotic: 0,
                        showinOverview: 0,
                        isSuspended: 0,
                    },
                },
                { $sort: { created: 1 } },
            ];
            // Count total records
            const countPipeline = [
                ...commonStage,
                {
                    $count: 'totalRecords',
                },
            ];
            // Retrieve subset of records
            const subsetPipeline = [
                ...commonStage,
                {
                    $project: {
                        items: 0,
                    },
                },
                ...(pagination
                    ? [
                        {
                            $skip: skip,
                        },
                        {
                            $limit: limit,
                        },
                    ]
                    : []),
            ];

            let totalRecordsResult = await Category.aggregate(countPipeline);
            let subsetResult = await Category.aggregate(subsetPipeline);
            response.totalRecords =
                totalRecordsResult.length > 0 ? totalRecordsResult[0].totalRecords : 0;
            response.overviewList = subsetResult;
            return res.success(response, req.__('GET_GUIDLINE'));
        } catch (error) {
            console.log('All Guildline Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    // async getOverviewList(req, res) {
    //     try {
    //         const params = _.extend(req.query || {}, req.params || {}, req.body || {});
    //         let { pagination, skip = 0, limit = process.env.MAX_LIMIT, overviewId } = params;
    //         let response = {};

    //         skip = typeof skip === 'string' ? parseInt(skip) : skip;
    //         limit = typeof limit === 'string' ? parseInt(limit) : limit;

    //         const categoryDetails = await Category.findOne({ _id: overviewId });

    //         // Match stage to filter documents (if needed)
    //         const commonStage = [
    //             {
    //                 $match: {
    //                     category: categoryDetails._id,
    //                     isDeleted: false,
    //                     isSuspended: false,
    //                     showInOverview: true
    //                 },
    //             },
    //             { $sort: { created: -1 } },
    //         ];
    //         // $lookup stage to fetch details of parent category
    //         const categoryLookupStage = {
    //             $lookup: {
    //                 from: 'categories', // Change to the actual name of the Category collection
    //                 localField: 'category',
    //                 foreignField: '_id',
    //                 as: 'parentDetails',
    //             },
    //         };

    //         // $lookup stage to fetch details of children subcategories
    //         const subcategoryLookupStage = {
    //             $lookup: {
    //                 from: 'subcategories', // Change to the actual name of the SubCategory collection
    //                 localField: 'children',
    //                 foreignField: '_id',
    //                 as: 'subcategories',
    //             },
    //         };

    //         // $lookup stage to fetch details of parent documents from Page collection
    //         const pageLookupStage = {
    //             $lookup: {
    //                 from: 'chapters', // Change to the actual name of the Page collection
    //                 localField: '_id',
    //                 foreignField: 'subcategory',
    //                 as: 'childrens',
    //             },
    //         };

    //         // Update the $match stage for chapters
    //         const chapterMatchStage = {
    //             $match: {
    //                 isDeleted: false,
    //                 isSuspended: false,
    //                 // showInOverview: true  // Only show chapters with showInOverview set to true
    //             },
    //         };

    //         // Count total records
    //         const countPipeline = [
    //             ...commonStage,
    //             categoryLookupStage,
    //             subcategoryLookupStage,
    //             pageLookupStage,
    //             chapterMatchStage,
    //             {
    //                 $count: 'totalRecords',
    //             },
    //         ];

    //         // Retrieve subset of records
    //         const subsetPipeline = [
    //             ...commonStage,
    //             categoryLookupStage,
    //             subcategoryLookupStage,
    //             chapterMatchStage,
    //             pageLookupStage,

    //             {
    //                 $addFields: {
    //                     'childrens': {
    //                         $map: {
    //                             input: '$childrens',
    //                             as: 'child',
    //                             in: {
    //                                 $mergeObjects: [
    //                                     '$$child',
    //                                     {
    //                                         icons: {
    //                                             $switch: {
    //                                                 branches: [
    //                                                     {
    //                                                         case: { $eq: ['$$child.type', 'Guideline'] },
    //                                                         then: 'home/guidelines.png',
    //                                                     },
    //                                                     {
    //                                                         case: { $eq: ['$$child.type', 'Classifications'] },
    //                                                         then: 'home/classifications.png',
    //                                                     },
    //                                                     {
    //                                                         case: { $eq: ['$$child.type', 'Decision'] },
    //                                                         then: 'decision_making.png',
    //                                                     },
    //                                                     {
    //                                                         case: { $eq: ['$$child.type', 'Antibiotics'] },
    //                                                         then: 'antibiotics.png',
    //                                                     }
    //                                                 ],
    //                                                 default: null,
    //                                             },
    //                                         },
    //                                     },
    //                                 ],
    //                             },
    //                         },
    //                     },
    //                 },
    //             },
    //             {
    //                 $addFields: {
    //                     'childrens': {
    //                         $concatArrays: ['$subcategories', '$chapters'],
    //                     },
    //                 },
    //             },
    //             {
    //                 $project: {
    //                     items: 0,
    //                     subcategories: 0,
    //                     chapters: 0,
    //                 },
    //             },
    //             ...(pagination
    //                 ? [
    //                     {
    //                         $skip: skip,
    //                     },
    //                     {
    //                         $limit: limit,
    //                     },
    //                 ]
    //                 : []),
    //         ];

    //         let totalRecordsResult = await SubCategory.aggregate(countPipeline);
    //         let subsetResult = await SubCategory.aggregate(subsetPipeline);
    //         response.totalRecords =
    //             totalRecordsResult.length > 0 ? totalRecordsResult[0].totalRecords : 0;
    //         response.overviewList = subsetResult;

    //         response.overviewList = await Promise.all(
    //             response.overviewList.map(async (subcategory) => {
    //                 const chapters = await getChaptersRecursively(subcategory._id);
    //                 return { ...subcategory, childrens: chapters };
    //             })
    //         );

    //         return res.success(response, req.__('OVERVIEW_LIST'));
    //     } catch (error) {
    //         console.log('Get Guideline List Error', error);
    //         return res.serverError(error, req.__('GENERAL_ERROR'));
    //     }
    // }

    async getOverviewList(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            let { pagination, skip = 0, limit = process.env.MAX_LIMIT, overviewId } = params;
            let response = {};

            skip = typeof skip === 'string' ? parseInt(skip) : skip;
            limit = typeof limit === 'string' ? parseInt(limit) : limit;

            const categoryDetails = await Category.findOne({ _id: overviewId });

            // Match stage to filter documents (if needed)
            const commonStage = [
                {
                    $match: {
                        category: categoryDetails._id,
                        isDeleted: false,
                        isSuspended: false,
                        showInOverview: true,
                    },
                },
                { $sort: { created: -1 } },
            ];

            // $lookup stage to fetch details of parent category
            const categoryLookupStage = {
                $lookup: {
                    from: 'categories', // Change to the actual name of the Category collection
                    localField: 'category',
                    foreignField: '_id',
                    as: 'parentDetails',
                },
            };

            // $lookup stage to fetch details of children subcategories
            const subcategoryLookupStage = {
                $lookup: {
                    from: 'subcategories', // Change to the actual name of the SubCategory collection
                    localField: '_id',
                    foreignField: 'parent',
                    as: 'subcategories',
                },
            };

            // $lookup stage to fetch details of children chapters
            const chapterLookupStage = {
                $lookup: {
                    from: 'chapters', // Change to the actual name of the Chapter collection
                    localField: 'children',
                    foreignField: 'subcategory',
                    as: 'chapters',
                },
            };

            // Update the $match stage for chapters
            const chapterMatchStage = {
                $match: {
                    isDeleted: false,
                    isSuspended: false,
                    // showInOverview: true  // Only show chapters with showInOverview set to true
                },
            };

            // Count total records
            const countPipeline = [
                ...commonStage,
                categoryLookupStage,
                subcategoryLookupStage,
                chapterLookupStage,
                chapterMatchStage,
                {
                    $count: 'totalRecords',
                },
            ];

            // Retrieve subset of records
            const subsetPipeline = [
                ...commonStage,
                categoryLookupStage,
                subcategoryLookupStage,
                chapterMatchStage,
                chapterLookupStage,
                {
                    $addFields: {
                        'childrens': {
                            $concatArrays: ['$subcategories', '$chapters'],
                        },
                    },
                },
                {
                    $project: {
                        items: 0,
                        subcategories: 0,
                        chapters: 0,
                    },
                },
                ...(pagination
                    ? [
                        {
                            $skip: skip,
                        },
                        {
                            $limit: limit,
                        },
                    ]
                    : []),
            ];

            let totalRecordsResult = await SubCategory.aggregate(countPipeline);
            let subsetResult = await SubCategory.aggregate(subsetPipeline);
            response.totalRecords =
                totalRecordsResult.length > 0 ? totalRecordsResult[0].totalRecords : 0;
            // response.overviewList = subsetResult;
            response.overviewList = await Promise.all(
                subsetResult.map(async (subcategory) => {
                    const chapters = await getChaptersRecursively(subcategory._id);
                    return { ...subcategory, childrens: chapters };
                })
            );


            response.overviewList = await Promise.all(
                subsetResult.map(async (subcategory) => {
                    const chapters = await getChaptersRecursively(subcategory._id);

                    // Extract the document data without internal metadata
                    const childrensWithoutMetadata = await Promise.all(chapters.map(async child => {
                        const childObject = child.toJSON({ getters: true });
                        const { _id, subHeading, type, ...rest } = childObject;

                        // Define image paths based on the child type
                        let image = '';
                        switch (type) {
                            case 'Guideline':
                                image = 'home/guidelines.png';
                                break;
                            case 'Classifications':
                                image = 'home/classifications.png';
                                break;
                            case 'Decision':
                                image = 'decision_making.png';
                                break;
                            case 'Antibiotics':
                                image = 'antibiotics.png';
                                break;
                            // Add more cases as needed
                            default:
                                // Default image path when type doesn't match any case
                                image;
                        }

                        // Check if the child has more subcategories
                        const hasMoreSubcategories = await SubCategory.findOne({
                            parent: child._id,
                            isDeleted: false,
                            isSuspended: false,
                            // showInOverview: true,
                        });
                        // Check if the child has subheading
                        const hasSubheading = subHeading !== undefined && subHeading !== null && subHeading !== '';

                        return { _id, name: rest.name, image, hasMore: hasMoreSubcategories ? true : false, subHeading: hasSubheading ? subHeading : '', };
                    }));

                    return { ...subcategory, childrens: childrensWithoutMetadata };
                })
            );






            return res.success(response, req.__('OVERVIEW_LIST'));
        } catch (error) {
            console.log('Get Guideline List Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }


    async getDetalOverviewList(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            let { pagination, skip = 0, limit = process.env.MAX_LIMIT, subchapterId } = params;
            let response = {};

            skip = typeof skip === 'string' ? parseInt(skip) : skip;
            limit = typeof limit === 'string' ? parseInt(limit) : limit;

            // Match stage to filter documents (if needed)
            const commonStage = [
                // Existing stages remain the same
                // ...

                // New $match stage to filter by subcategory and showInOverview
                {
                    $match: {
                        subcategory: subchapterId,
                        showInOverview: true,
                        isDeleted: false,
                        isSuspended: false,
                    },
                },
            ];

            // $lookup stage to fetch details of parent documents from SubCategory collection
            const subcategoryLookupStage = {
                $lookup: {
                    from: 'subcategories', // Change to the actual name of the SubCategory collection
                    localField: 'category',  // Field in the Page collection
                    foreignField: '_id',    // Field in the SubCategory collection
                    as: 'parentDetails',
                },
            };

            // $lookup stage to fetch details of the parent category from Category collection
            const categoryLookupStage = {
                $lookup: {
                    from: 'categories', // Change to the actual name of the Category collection
                    localField: 'parent', // Adjust based on the actual structure of your data
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            };


            // Count total records
            const countPipeline = [
                ...commonStage,
                subcategoryLookupStage,
                categoryLookupStage,
                {
                    $count: 'totalRecords',
                },
            ];

            // Retrieve subset of records
            const subsetPipeline = [
                ...commonStage,
                subcategoryLookupStage,
                categoryLookupStage,
                {
                    $project: {
                        items: 0,
                    },
                },
                ...(pagination
                    ? [
                        {
                            $skip: skip,
                        },
                        {
                            $limit: limit,
                        },
                    ]
                    : []),
            ];

            let totalRecordsResult = await Chapter.aggregate(countPipeline);
            let subsetResult = await Chapter.aggregate(subsetPipeline);
            response.totalRecords =
                totalRecordsResult.length > 0 ? totalRecordsResult[0].totalRecords : 0;
            response.overviewList = subsetResult;
            return res.success(response, req.__('OVERVIEW_LIST'));
            // Send the response

        } catch (error) {
            console.log('Get Guideline List Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async getOverviewChapterList(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { subchapterId } = params;

            const pageData = await Page.find({ subcategory: subchapterId, isSuspended: false, isDeleted: false }).populate('parent');
            return res.success(pageData, req.__('GENERAL_ERROR'));
        } catch (error) {
            console.log('Get Overview Chapter List Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async detailOverview(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { overviewId, pageId } = params;
            // const guidline_id = new mongoose.Types.ObjectId(guidelineId);
            // // const page_id = new mongoose.Types.ObjectId(detailId);

            let detailPage = await Page.findOne({
                // parent: { $in: guidelineId },
                _id: pageId,
            });
            return res.render(path.join(__dirname, '../../views/guidline'), { title: detailPage.name, content: detailPage.content });
            // return res.success(detailPage, req.__('LIST_GUIDLINE'));
        } catch (error) {
            console.log('Detail Classification Page Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }


}
module.exports = new OverviewController();