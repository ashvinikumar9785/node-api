const {
    models: { Chapter, Category, SubCategory },
} = require('../../../../lib/models');
const _ = require('lodash');
const mongoose = require('mongoose');
const path = require('path');
const keyword_extractor = require("keyword-extractor");
const cheerio = require('cheerio');


class ClassificationController {


    async getClassification(req, res) {
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
                        showinClassification: true,
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
            response.classificationList = subsetResult;
            return res.success(response, req.__('GET_CLASSIFICATION'));
        } catch (error) {
            console.log('All Classification Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }



    // async listClassification(req, res) {
    //     try {
    //         const params = _.extend(req.query || {}, req.params || {}, req.body || {});
    //         let {
    //             pagination,
    //             skip = 0,
    //             limit = process.env.MAX_LIMIT,
    //             classificationId,
    //         } = params;
    //         let response = {};

    //         skip = typeof skip === 'string' ? parseInt(skip) : skip;
    //         limit = typeof limit === 'string' ? parseInt(limit) : limit;

    //         const commonStage = [
    //             {
    //                 $match: {
    //                     isDeleted: false,
    //                     isSuspended: false,
    //                 },
    //             },
    //             {
    //                 $sort: { created: -1 },
    //             },
    //         ];

    //         const matchAntibioticIdStage = {
    //             $match: {
    //                 _id: new mongoose.Types.ObjectId(classificationId),
    //             },
    //         };

    //         const lookupSubcategoriesStage = {
    //             $lookup: {
    //                 from: 'subcategories',
    //                 localField: '_id',
    //                 foreignField: 'category',
    //                 as: 'subcategories',
    //             },
    //         };

    //         const lookupChaptersStage = {
    //             $lookup: {
    //                 from: 'chapters',
    //                 localField: '_id',
    //                 foreignField: 'parent',
    //                 as: 'chapters',
    //             },
    //         };

    //         const countPipeline = [
    //             ...commonStage,
    //             matchAntibioticIdStage,
    //             lookupSubcategoriesStage,
    //             lookupChaptersStage,
    //             {
    //                 $addFields: {
    //                     totalRecords: {
    //                         $add: [
    //                             { $size: '$subcategories' },
    //                             { $size: '$chapters' },
    //                         ],
    //                     },
    //                 },
    //             },
    //         ];

    //         const subsetPipeline = [
    //             ...commonStage,
    //             matchAntibioticIdStage,
    //             lookupSubcategoriesStage,
    //             lookupChaptersStage,
    //             {
    //                 $project: {
    //                     _id: 1,
    //                     name: 1,
    //                     image: 1,
    //                     pages: {
    //                         $map: {
    //                             input: {
    //                                 $slice: [
    //                                     {
    //                                         $concatArrays: ['$subcategories', '$chapters'],
    //                                     },
    //                                     skip,
    //                                     limit,
    //                                 ],
    //                             },
    //                             as: 'page',
    //                             in: {
    //                                 _id: '$$page._id',
    //                                 name: '$$page.name',
    //                                 image: '$$page.image', // Add 'image' field if it exists
    //                             },
    //                         },
    //                     },
    //                 },
    //             },
    //         ];

    //         let totalRecordsResult = await Category.aggregate(countPipeline);
    //         let subsetResult = await Category.aggregate(subsetPipeline);

    //         response.totalRecords =
    //             totalRecordsResult.length > 0 ? totalRecordsResult[0].totalRecords : 0;

    //         // Check if there are more pages available
    //         for (const subcategory of subsetResult[0].pages) {
    //             // Check in SubCategory table for child subcategories
    //             const subcategories = await SubCategory.find({ parent: subcategory._id });
    //             subcategory.hasMore = subcategories.length > 0;
    //         }

    //         // Remove the extra result used to check 'hasMore'
    //         if (pagination) {
    //             subsetResult.pop();
    //         }

    //         response.classificationList = subsetResult[0];
    //         return res.success(response, req.__('GET_CLASSIFICATION'));
    //     } catch (error) {
    //         console.log('List Antibiotics Error', error);
    //         return res.serverError(error, req.__('GENERAL_ERROR'));
    //     }
    // }

    async listClassification(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            let {
                pagination,
                skip = 0,
                limit = process.env.MAX_LIMIT,
                classificationId,
            } = params;
            let response = {};

            skip = typeof skip === 'string' ? parseInt(skip) : skip;
            limit = typeof limit === 'string' ? parseInt(limit) : limit;

            // Match category ID in Category model
            const matchCategoryIDStage = {
                $match: {
                    _id: new mongoose.Types.ObjectId(classificationId),
                },
            };

            // Lookup SubCategories for the given Category
            const lookupSubCategoriesStage = {
                $lookup: {
                    from: 'subcategories',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'subcategories',
                },
            };

            // Lookup Chapters that contain the specified SubCategory ID
            // const lookupChaptersStage = {
            //     $lookup: {
            //         from: 'chapters',
            //         localField: '_id',
            //         foreignField: 'subcategory',
            //         as: 'chapters',
            //     },
            // };

            // Lookup Chapters that contain the specified SubCategory ID and have type "Decision"
            const lookupChaptersStage = {
                $lookup: {
                    from: 'chapters',
                    let: { subcategoryId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$subcategory', '$$subcategoryId'] },
                                        { $eq: ['$type', 'Classifications'] }, // Add this line to filter by type
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'chapters',
                },
            };


            const subsetPipeline = [
                matchCategoryIDStage,
                lookupSubCategoriesStage,
                lookupChaptersStage,
                {
                    $addFields: {
                        subcategories: {
                            $map: {
                                input: '$subcategories',
                                as: 'sub',
                                in: {
                                    _id: '$$sub._id',
                                    name: '$$sub.name',
                                    image: '$$sub.image',
                                    // icon: 'home/Classifications', // Added 'icon' field
                                },
                            },
                        },
                        chapters: {
                            $map: {
                                input: '$chapters',
                                as: 'chap',
                                in: {
                                    _id: '$$chap._id',
                                    name: '$$chap.name',
                                    image: '$$chap.image',
                                    // icon: 'home/Classifications', // Added 'icon' field
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        pages: {
                            $concatArrays: ['$subcategories', '$chapters'],
                        },
                        totalRecords: {
                            $add: [
                                { $size: '$subcategories' },
                                { $size: '$chapters' },
                            ],
                        },
                    },
                },
                {
                    $addFields: {
                        pages: {
                            $slice: ['$pages', skip, limit],
                        },
                    },
                },
                {
                    $project: {
                        subcategories: 0,
                        chapters: 0,
                    },
                },
            ];




            let subsetResult = await Category.aggregate(subsetPipeline);


            if (subsetResult && subsetResult.length > 0 && subsetResult[0].pages) {
                const pagesWithSubcategory = await Promise.all(subsetResult[0].pages.map(async (page) => {
                    // Check if there is any associated subcategory with the page ID
                    const hasSubcategory = await SubCategory.findOne({ parent: page._id });
                    return { ...page, hasMore: !!hasSubcategory, subHeading: page.subHeading || '' };
                }));

                if (pagination) {
                    subsetResult.pop(); // Remove the extra result used to check 'hasMore'
                }
                response.classificationList = { _id: subsetResult[0]._id, name: subsetResult[0].name, image: subsetResult[0].image, pages: pagesWithSubcategory, totalRecords: pagesWithSubcategory.length };
            }
            return res.success(response, req.__('GET_GUIDELINE'));

        } catch (error) {
            console.log('List Decisions Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }


    async detailClassification(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { pageId } = params;


            let detailPage = await Chapter.findOne({
                _id: pageId,
            });
            return res.render(path.join(__dirname, '../../views/page'), { title: detailPage.name, content: detailPage.content });

        } catch (error) {
            console.log('Detail Classification Page Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

}


module.exports = new ClassificationController();