const mongoose = require('mongoose');
const {
  models: { Chapter, Category, SubCategory },
} = require('../../../../lib/models');
const _ = require('lodash');
const path = require('path');
// const { SubCategory } = require('../../../../lib/models/models');


class GuildlineController {

  async getGuidlines(req, res) {
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
            showinGuidline: true,
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
      response.guidlineList = subsetResult;
      return res.success(response, req.__('GET_GUIDLINE'));
    } catch (error) {
      console.log('All Guildline Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async listGuidlines(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      let {
        pagination,
        skip = 0,
        limit = process.env.MAX_LIMIT,
        guidelineId,
      } = params;
      let response = {};

      skip = typeof skip === 'string' ? parseInt(skip) : skip;
      limit = typeof limit === 'string' ? parseInt(limit) : limit;

      // Match category ID in Category model
      const matchCategoryIDStage = {
        $match: {
          _id: new mongoose.Types.ObjectId(guidelineId),
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
                    { $eq: ['$type', 'Guideline'] }, // Add this line to filter by type
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
                  // icon: 'home/decision', // Added 'icon' field
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
                  // icon: 'home/decision', // Added 'icon' field
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
        response.guidlineList = { _id: subsetResult[0]._id, name: subsetResult[0].name, image: subsetResult[0].image, pages: pagesWithSubcategory, totalRecords: pagesWithSubcategory.length };
      }

      return res.success(response, req.__('GET_GUIDELINE'));


    } catch (error) {
      console.log('List Decisions Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async detailGuidline(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { pageId } = params;

      let detailPage = await Chapter.findOne({
        $or: [
          { _id: pageId },
          { parent: pageId },
        ],
      });

      if (!detailPage) {
        const subcategoryPage = await Chapter.findOne({
          'subcategory': pageId,
        });

        if (subcategoryPage) {
          detailPage = subcategoryPage;
        }
      }

      if (detailPage) {
        return res.render(path.join(__dirname, '../../views/page'), { title: detailPage.name, content: detailPage.content });
        // Alternatively, you can return the page data as JSON:
        // return res.success(detailPage, req.__('LIST_GUIDELINE'));
      } else {
        return res.notFound(req.__('PAGE_NOT_FOUND'));
      }
    } catch (error) {
      console.log('Detail Antibiotic Page Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }
}

module.exports = new GuildlineController();
