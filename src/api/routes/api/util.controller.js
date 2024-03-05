const path = require('path');
const {
  models: { Enquiry, Home, Chapter, Reference, Static, SubCategory },
} = require('../../../../lib/models');
const _ = require('lodash');
const fs = require('fs');
const modelList = require('../../../../lib/models/models');


async function fetchParentDetails(parentId) {
  console.log('parentId', parentId);
  // const parentDetails = await Chapter.findOne({ _id: parentId });
  // console.log()
  // if (parentDetails) {
  // Determine the route based on the model type
  // let route = '';
  // if (parentDetails.type === 'Classification') {
  //   route = 'detail-classification';
  // } else if (parentDetails.type === 'Antibiotics') {
  //   route = 'detail-antibiotic';
  // } else if (parentDetails.type === 'Decision') {
  //   route = 'detail-decision';
  // } else if (parentDetails.type === 'Guidline') {
  //   route = 'detail-guidlines';
  // } else if (parentDetails.type === 'Guideline') {
  //   route = 'detail-guidlines';
  // }
  // else {
  let route = 'view-detail';
  // }
  return { route };
  // }

  // If no parent found, you can handle this case accordingly
  // return null;
}



class UtilController {

  async addEnquiryQuery(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { name, email, message } = params;

      let newQuery = await Enquiry.create({
        name, email, message
      });

      return res.success(newQuery, req.__('ADD_ENQUIRY'));
    }
    catch (error) {
      console.log('Add Enquiry Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async addHomeIcons(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});

      const { name } = params;
      let image;
      if (req.file) {
        image = `${req.file.originalname}`;
      }

      let newHomeItem = await Home.create({
        name, image
      })

      return res.success(newHomeItem, req.__('ADD_HOME_ITEM'));
    }
    catch (error) {
      console.log('Add Home Icon Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getHomeIcons(req, res) {
    try {
      let homeData = await Home.find({ isSuspended: false, isDeleted: false }).sort({ created: -1 });
      return res.success(homeData, req.__('LIST_HOME_ITEM'));
    }
    catch (error) {
      console.log('Add Home Icon Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async viewStaticPage(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { type } = params;
      switch (type) {

        case 'terms-condition':
          const termsContent = await Static.findOne({ type: 'TERMS' });
          return res.render(path.join(__dirname, '../../views/static'), { content: termsContent.content, image: termsContent.image, title: termsContent.title });

        case 'privacy-policy':
          const privacyContent = await Static.findOne({ type: 'PRIVACY' });
          return res.render(path.join(__dirname, '../../views/static'), { content: privacyContent.content, image: privacyContent.image, title: privacyContent.title });


        case 'about-us':
          const aboutContent = await Static.findOne({ type: 'ABOUT' });
          return res.render(path.join(__dirname, '../../views/static'), { content: aboutContent.content, image: aboutContent.image, title: aboutContent.title });

        default:
          return res.warn({}, req.__('NO_SUCH_PAGE'));
      }

    }
    catch (error) {
      console.log('View Page Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }


  async previewStaticPage(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { type } = params;

      switch (type) {
        case 'terms-condition': {
          return res.success({ url: 'https://mymeetingdesk.com:7410/api/view-page/terms-condition' }, req.__('STATIC_PAGE'));
        }
        case 'privacy-policy': {
          return res.success({
            url: 'https://mymeetingdesk.com:7410/api/view-page/privacy-policy'
          }, req.__('STATIC_PAGE'));
        }
        case 'about-us': {
          return res.success({ url: 'https://mymeetingdesk.com:7410/api/view-page/about-us' }, req.__('STATIC_PAGE'));
        }
        default:
          return res.warn({}, req.__('NO_SUCH_PAGE'));
      }
    }
    catch (error) {
      console.log('Static Page Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }


  async getRefrences(req, res) {
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

            isDeleted: false,
            isSuspended: false,
          }
        },
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

      let totalRecordsResult = await Reference.aggregate(countPipeline);
      let subsetResult = await Reference.aggregate(subsetPipeline);
      response.totalRecords = totalRecordsResult.length > 0 ? totalRecordsResult[0].totalRecords : 0;
      response.refrenceList = subsetResult;

      return res.success(response, req.__('REFRENCE_DATA'));
    } catch (error) {
      console.log('Enquiry Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async searchData(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { search } = params;

      // Search in each model
      const results = await Promise.all([
        // Search in the Page model for keywords
        Chapter.find({
          $or: [
            { name: { $regex: search, $options: 'i' } }, // Case-insensitive name search
            { subHeading: { $regex: search, $options: 'i' } }, // Case-insensitive subheading search
            { keywords: { $in: [new RegExp(search, 'i')] } }, // Case-insensitive keyword search
          ],
        }, 'name subHeading parent'),
      ]);
      // Combine and send results
      // const combinedResults = [].concat(...results);
      const combinedResults = await Promise.all([].concat(...results).map(async (result) => {
        const parentDetails = await fetchParentDetails(result._id); // Assuming parent[0] is the parent ID
        console.log('data', parentDetails);
        return {
          ...result.toObject(),
          icon: 'home/link.png',
          url: `https://mymeetingdesk.com:7410/api/${parentDetails.route}/${result._id}`,
          // parentDetails
        };

        // Add or modify the "icon" key as needed for each document

      }));
      return res.success({ results: combinedResults }, req.__('SEARCH_RESULT'));

    } catch (error) {
      console.log('Search  Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }


  async overview(req, res) {
    try {
      const overviewData = [];

      // Iterate over each model
      for (const modelName in modelList) {
        if (modelName.toLowerCase() !== 'page') {
          const Model = modelList[modelName];
          const result = await Model.find({ showInOverview: true });
          // overviewData[modelName] = result;
          // Include additional fields or manipulate the data as needed
          const formattedResults = result.map((item) => {
            // const formattedItem = item.toObject(); // Convert Mongoose document to plain JavaScript object
            // Add more fields if needed
            const formattedItem = {
              _id: item._id,
              name: item.name,
              image: item.image, // Adjust this based on the actual field name in your model
            };
            return formattedItem;
          });

          overviewData.push(...formattedResults);
        }
      }

      // Fetch related data from Page model
      // const pageResult = await modelList.Pa  ge.find({ showInOverview: true }).populate('parent', 'name icon');

      // overviewData['page'] = pageResult;

      // res.json(overviewData);
      // res.json({
      //   success: true,
      //   data: {
      //     results: overviewData,
      //   },
      //   message: 'SEARCH_RESULT',
      // });
      return res.success({ results: overviewData }, req.__('OVERVIEW_LIST'));
    } catch (error) {
      console.log('Overview Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async detailSearchPage(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { pageId } = params;

      // const guidline_id = new mongoose.Types.ObjectId(guidelineId);
      // // const page_id = new mongoose.Types.ObjectId(detailId);

      let detailPage = await Chapter.findOne({
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

  // async getNestedChild(req, res) {
  //   try {
  //     const params = _.extend(req.query || {}, req.params || {}, req.body || {});
  //     const { parentId, skip = 0, limit = process.env.MAX_LIMIT } = params;

  //     // Find child subcategories
  //     const childSubcategories = await SubCategory.find({ parent: parentId })
  //       .skip(parseInt(skip))
  //       .limit(parseInt(limit));

  //     // Find parent subcategory
  //     const parent = await SubCategory.findById(parentId);
  //     const result = {
  //       parent,
  //       pages: [],
  //     };

  //     // Process child subcategories
  //     for (const subcategory of childSubcategories) {
  //       const hasChild = await SubCategory.exists({ parent: subcategory._id });
  //       const subcategoryDetails = {
  //         _id: subcategory._id,
  //         name: subcategory.name,
  //         image: subcategory.image || parent.image || '',
  //         hasMore: hasChild ? true : false,
  //       };
  //       result.pages.push(subcategoryDetails);

  //       // Search for chapters with the same subcategory ID
  //       const chaptersWithSubcategoryId = await Chapter.find({ subcategory: parentId });
  //       for (const chapter of chaptersWithSubcategoryId) {
  //         // const chapterHasChild = await SubCategory.exists({ parent: chapter.subcategory });
  //         // console.log('chapterHasChild', chapterHasChild);
  //         const chapterDetails = {
  //           _id: chapter._id,
  //           name: chapter.name,
  //           image: (chapter.type === 'Antibiotics' && 'home/antibiotics.png') || (chapter.type === 'Classifications' && 'home/classifications.png')
  //             || (chapter.type === 'Guideline' && 'home/guidelines.png') || (chapter.type === 'Decision' && 'home/decision_making.png'),
  //           subHeading: chapter.subHeading,
  //           // Include other chapter details as needed
  //           hasMore: false,
  //         };

  //         result.pages.push(chapterDetails);
  //       }
  //     }

  //     return res.success(result, req.__('GET_NESTED_CHILD'));
  //   } catch (error) {
  //     console.log('Detail Classification Page Error', error);
  //     return res.serverError(error, req.__('GENERAL_ERROR'));
  //   }
  // }

  async getNestedChild(req, res) {
    try {
      const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { parentId, skip = 0, limit = process.env.MAX_LIMIT } = params;

      // Find child subcategories
      const childSubcategories = await SubCategory.find({ parent: parentId })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      // Find parent subcategory
      const parent = await SubCategory.findById(parentId);
      const result = {
        parent,
        pages: [],
      };

      // Track unique chapter IDs
      const uniqueChapterIds = new Set();

      // Process child subcategories
      for (const subcategory of childSubcategories) {
        const hasChild = await SubCategory.exists({ parent: subcategory._id });
        const subcategoryDetails = {
          _id: subcategory._id,
          name: subcategory.name,
          image: subcategory.image || parent.image || '',
          hasMore: hasChild ? true : false,
        };
        result.pages.push(subcategoryDetails);
      }

      // Search for chapters with the same subcategory ID
      const chaptersWithSubcategoryId = await Chapter.find({ subcategory: parentId });
      for (const chapter of chaptersWithSubcategoryId) {
        // Convert ObjectId to string
        const chapterIdString = chapter._id.toString();

        // Check if the chapter ID is already added
        if (!uniqueChapterIds.has(chapterIdString)) {
          const chapterDetails = {
            _id: chapterIdString,
            name: chapter.name,
            image: (chapter.type === 'Antibiotics' && 'home/antibiotics.png') ||
              (chapter.type === 'Classifications' && 'home/classifications.png') ||
              (chapter.type === 'Guideline' && 'home/guidelines.png') ||
              (chapter.type === 'Decision' && 'home/decision_making.png'),
            subHeading: chapter.subHeading,
            // Include other chapter details as needed
            hasMore: false,
          };

          // Add chapter ID to the set to mark it as added
          uniqueChapterIds.add(chapterIdString);

          result.pages.push(chapterDetails);
        }
      }

      return res.success(result, req.__('GET_NESTED_CHILD'));
    } catch (error) {
      console.log('Detail Classification Page Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }



  async detailPage(req, res) {
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
        return res.success({ url: `https://mymeetingdesk.com:7410/api/view-detail/${pageId}` }, req.__('STATIC_PAGE'));
        // return res.render(path.join(__dirname, '../../views/guidline'), { title: detailPage.name, content: detailPage.content });
        // Alternatively, you can return the page data as JSON:
        // return res.success(detailPage, req.__('LIST_GUIDELINE'));
      } else {
        return res.notFound({}, req.__('PAGE_NOT_FOUND'));
      }
    } catch (error) {
      console.log('Detail  Page Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }


  async viewDetailPage(req, res) {
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
        return res.render(path.join(__dirname, '../../views/page'), { title: detailPage.name, content: detailPage.content, description: detailPage.subHeading });
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
module.exports = new UtilController();