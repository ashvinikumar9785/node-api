const {
  models: { Static, Chapter, Reference, Category, SubCategory, Admin },
} = require('../../../../lib/models');
const _ = require('lodash');
const mongoose = require('mongoose');
// const path = require('path');
// const modelList = require('../../../../lib/models/models');
const keyword_extractor = require('keyword-extractor');
const cheerio = require('cheerio');

class AdminController {
  // ------------------------------------------------------------------SubCategory Actions
  async addSubCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { name, category, showInOverview } = params;

      // Check if subcategory with the same name already exists
      const existingSubCategory = await SubCategory.findOne({ name, category });
      if (existingSubCategory) {
        return res.warn({}, req.__('ALREADY_EXISTS'));
      }

      // Check if the specified category exists
      const existingCategory = await Category.findOne({ _id: category });
      if (!existingCategory) {
        return res.warn({}, req.__('INVALID_CATEGORY'));
      }

      // Create a new subcategory
      let newSubCategory = await SubCategory.create({
        name,
        category: existingCategory._id,
        showInOverview,
      });

      // Save the new subcategory
      await newSubCategory.save();

      return res.success(newSubCategory, req.__('ADD_CATEGORY'));
    } catch (error) {
      console.log('Add SubCategory Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async deleteSubCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { _id } = params;

      let deleted = await SubCategory.deleteOne({
        _id,
      });
      return res.success(deleted, req.__('DELETE_SUBCATEGORY'));
    } catch (error) {
      console.log('Delete Category Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async updateSubCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { _id, name, category, showInOverview } = params;
      console.log('>>>>>>>>>>>>>>>>', params);
      let checkExisting = await Category.findOne({ _id: category });
      let newSubCategory = await SubCategory.findOne({
        _id,
      }).sort({ updated: -1 });
      if (!newSubCategory) {
        return res.success({}, req.__('NO_SUBCATEGORY'));
      }
      let image;
      if (req.file) {
        image = `${req.file.originalname}`;
        newSubCategory.image = image;
      }
      newSubCategory.name = name;
      newSubCategory.category = checkExisting._id;
      newSubCategory.showInOverview = showInOverview;
      await newSubCategory.save();
      return res.success(newSubCategory, req.__('ADD_CATEGORY'));
    } catch (error) {
      console.log('Update  SubCategory Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getCategory(req, res) {
    try {
      let categoriesList = await Category.find({}).sort({ created: -1 });
      return res.success(categoriesList, req.__('LIST_CATEGORY'));
    } catch (error) {
      console.log('Get Category Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getSubCategory(req, res) {
    try {
      let categoriesList = await SubCategory.find({ category: { $ne: null } })
        .populate(['parent', 'category'])
        .sort({ created: -1 });
      return res.success(categoriesList, req.__('LIST_CATEGORY'));
    } catch (error) {
      console.log('Get Category Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async deleteCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { _id } = params;

      let deleted = await Category.deleteOne({
        _id,
      });
      return res.success(deleted, req.__('DELETE_CATEGORY'));
    } catch (error) {
      console.log('Delete Category Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async updateCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const {
        _id,
        name,
        showinDecision,
        showinAntibiotic,
        showinClassification,
        showinOverview,
        showinGuidline,
      } = params;

      let image;

      let findCat = await Category.findOne({ _id });
      if (!findCat) {
        return res.warn({}, req.__('NO_CATEGORY'));
      }

      if (req.file) {
        image = `${req.file.originalname}`;
        findCat.image = image;
      }
      findCat.name = name;
      findCat.showinDecision = showinDecision;
      findCat.showinAntibiotic = showinAntibiotic;
      findCat.showinClassification = showinClassification;
      findCat.showinOverview = showinOverview;
      findCat.showinGuidline = showinGuidline;
      await findCat.save();
      return res.success(findCat, req.__('UPDATE_CATEGORY'));
    } catch (error) {
      console.log('Add Category Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async addCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const {
        name,
        showinDecision,
        showinAntibiotic,
        showinClassification,
        showinOverview,
        showinGuidline,
      } = params;

      let image;
      if (req.file) {
        image = `${req.file.originalname}`;
      }

      let checkExisting = await Category.findOne({ name });
      if (checkExisting) {
        return res.warn({}, req.__('ALREADY_EXITS'));
      }
      let newCategory = await Category.create({
        name,
        image,
        showinDecision,
        showinAntibiotic,
        showinClassification,
        showinOverview,
        showinGuidline,
      });
      return res.success(newCategory, req.__('ADD_CATEGORY'));
    } catch (error) {
      console.log('Add Category Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async selectedCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { type } = params;
      let data = [];
      switch (type) {
        case 'decision':
          data = await Category.find({
            isSuspended: false,
            isDeleted: false,
            showinDecision: true,
          });
          break;
        case 'antibiotic':
          data = await Category.find({
            isSuspended: false,
            isDeleted: false,
            showinAntibiotic: true,
          });
          break;
        case 'classification':
          data = await Category.find({
            isSuspended: false,
            isDeleted: false,
            showinClassification: true,
          });
          break;
        case 'guidline':
          data = await Category.find({
            isSuspended: false,
            isDeleted: false,
            showinGuidline: true,
          });
          break;
        case 'overview':
          data = await Category.find({
            isSuspended: false,
            isDeleted: false,
            showinOverview: true,
          });
          break;
      }
      return res.success(data, req.__('ADD_CATEGORY'));
    } catch (error) {
      console.log('Add Category Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  // ------------------------------------------------------------------Static Chapter  Actions

  async getStaticPagesList(req, res) {
    try {
      const data = await Static.find({ isDeleted: false, isSuspended: false });
      return res.success(data, req.__('LIST_DATA'));
    } catch (error) {
      console.log('Static Pages List Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async addStaticPage(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { title, description, content, type } = params;

      let image;
      if (req.file) {
        image = `${req.file.originalname}`;
      }
      // Load the HTML into Cheerio
      const $ = cheerio.load(content);
      // Extract text content
      const textContent = $.text();
      const extraction_result = keyword_extractor.extract(textContent, {
        language: 'english',
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false,
      });

      const data = await Static.create({
        title,
        description,
        content,
        image,
        meta_keywords: extraction_result,
        type
      });

      return res.success(data, req.__('ADD_DATA'));
    } catch (error) {
      console.log('Static Pages List Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getStaticPages(req, res) {
    try {
      const data = await Static.find({ isSuspended: false, isDeleted: false });
      return res.success(data, req.__('ADD_DATA'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async updateStaticPage(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { _id, title, description, content } = params;

      let image = '';
      if (req.file) {
        image = `${req.file.originalname}`;
      }

      let checkIfExits = await Static.findOne({ _id });
      if (!checkIfExits) {
        return res.warn({}, req.__('NO_STATIC'));
      }
      const data = await Static.findOne({ _id });
      // Load the HTML into Cheerio
      const $ = cheerio.load(content);
      // Extract text content
      const textContent = $.text();
      const extraction_result = keyword_extractor.extract(textContent, {
        language: 'english',
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false,
      });
      data.title = title;
      data.description = description;
      data.content = content;
      if (image !== '') {
        data.image = image;
      }
      data.meta_keywords = extraction_result;

      data.meta_keywords = extraction_result;
      await data.save();
      return res.success(data, req.__('ADD_DATA'));
    } catch (error) {
      console.log('Static Pages List Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async detailStaticPage(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { _id } = params;
      const data = await Static.findOne({ _id });
      if (!data) {
        return res.warn(data, req.__('NO_PAGE'));
      }
      return res.success(data, req.__('PAGE_DETAIL'));
    } catch (error) {
      console.log('Static Pages Detail Error', error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }
  // ------------------------------------------------------------------Refrences Actions

  async addRefrences(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { references } = params;

      if (Array.isArray(references)) {
        references.map(async (item) => {
          await Reference.create({
            name: item.name,
            link: item.link,
          });
        });
      }

      return res.success({}, req.__('ADD_STATIC_PAGE'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getRefrences(req, res) {
    try {
      const refrenceData = await Reference.find({});
      return res.success(refrenceData, req.__('GET_REFRENCES'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  // ------------------------------------------------------------------Chapter Actions

  async addChapter(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { name, subHeading, content, type, subcategory, showInOverview } =
        params;
      // const parentId = new mongoose.Types.ObjectId(parent);
      const subcategorydetail = await SubCategory.findOne({ _id: subcategory });
      // Load the HTML into Cheerio
      const $ = cheerio.load(content);
      // Extract text content
      const textContent = $.text();
      const extraction_result = keyword_extractor.extract(textContent, {
        language: 'english',
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false,
      });

      let newChapter = await Chapter.create({
        name,
        subHeading,
        subcategory: new mongoose.Types.ObjectId(subcategory),
        content,
        // parent: subcategorydetail.parent ? subcategorydetail.parent : subcategorydetail.category,
        keyword: extraction_result,
        type,
        showInOverview,
      });

      return res.success(newChapter, req.__('ADD_CHAPTER'));
    } catch (error) {
      console.log(error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async updateChapter(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const {
        _id,
        name,
        subHeading,
        content,
        parent,
        subCategories,
        showInOverview,
      } = params;
      const parentId = new mongoose.Types.ObjectId(parent);
      // Load the HTML into Cheerio
      const $ = cheerio.load(content);
      // Extract text content
      const textContent = $.text();

      const extraction_result = keyword_extractor.extract(textContent, {
        language: 'english',
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false,
      });
      const findPage = await Chapter.findOne({ _id });

      if (!findPage) {
        return res.warn({}, req.__('NOT_UPDATED'));
      }

      if (findPage.name !== name) {
        findPage.name = name;
      }

      if (findPage.subHeading !== subHeading) {
        findPage.subHeading = subHeading;
      }

      findPage.content = content;
      findPage.keyword = extraction_result;
      if (findPage.parent != parent) {
        findPage.parent = parentId;
      }
      if (findPage.subcategory !== subCategories) {
        findPage.subcategory = new mongoose.Types.ObjectId(subCategories);
      }
      if (findPage.showInOverview !== showInOverview) {
        findPage.showInOverview = showInOverview;
      }

      await findPage.save();
      return res.success(findPage, req.__('UPDATE_DECISION'));
    } catch (error) {
      console.log(error);
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async deleteChapter(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { chapterId } = params;
      const checkIfExits = await Chapter.findOne({ _id: chapterId });
      if (!checkIfExits) {
        return res.warn({}, req.__('NO_CHAPTER_FOUND'));
      }
      const deleteChapter = await Chapter.deleteOne({ _id: chapterId });
      return res.success(deleteChapter, req.__('DELETE_CHAPTER'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getChapters(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { type } = params;
      console.log('type', type);
      // Find all categories
      const categories = await Category.find({});
      if (!categories || categories.length === 0) {
        console.log('No categories found');
        return [];
      }
      const subcategories = await SubCategory.find({});
      // Create an array of category IDs
      const categoryIds = categories.map((category) => category._id);
      const subcategorieIds = subcategories.map(
        (subcategories) => subcategories._id
      );
      const totalIds = [...subcategorieIds, ...categoryIds];
      // Query for pages associated with the found category IDs
      const pages = await Chapter.find({
        type,
        isSuspended: false,
        isDeleted: false,
      }).sort({ created: -1 }); // Populate the 'categoryId' field with the actual category data

      // Manually populate the 'parent' field with category details based on IDs
      const populatedPages = pages.map((page) => {
        const populatedParent = categories.find((category) =>
          category._id.equals(page.parent[0])
        );
        return { ...page.toObject(), parent: populatedParent };
      });
      return res.success(populatedPages, req.__('LIST_CHAPTER'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async updateChapterStatus(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { chapterId, isActive } = params;
      // Find all categories
      const checkIfExits = await Chapter.findOne({ _id: chapterId });
      if (!checkIfExits) {
        return res.warn({}, req.__('NO_CHAPTER_FOUND'));
      }
      const chapterDetail = await Chapter.update(
        { _id: chapterId },
        { $set: { isSuspended: isActive } }
      );
      return res.success(chapterDetail, req.__('UPDATE_CHAPTER'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getOverview(req, res) {
    try {
      const categories = await Category.find({});
      if (!categories || categories.length === 0) {
        console.log('No categories found');
        return [];
      }

      const overview = await Category.find({
        isSuspended: false,
        isDeleted: false,
        showinOverview: true,
      });
      return res.success(overview, req.__('UPDATE_CHAPTER'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getOverviewList(req, res) {
    try {
      const overviewList = await SubCategory.find({
        showInOverview: true,
        isSuspended: false,
        isDeleted: false,
      });
      return res.success(overviewList, req.__('LIST_OVERVIEW'));
    } catch (error) {
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async addtoOverviewList(req, res) {
    try {
      // Combine parameters from query, params, and body into a single object
      // const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      // const { overviewId, subchapterList } = params;

      // Return a success response with the updated overviewDetail
      return res.success({}, req.__('LIST_OVERVIEW'));
    } catch (error) {
      // Return a server error response in case of an exception
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getOverviewDetailList(req, res) {
    try {
      // Combine parameters from query, params, and body into a single object
      // const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const overviewPageList = await Chapter.find({
        isSuspended: false,
        isDeleted: false,
      }).populate('parent');
      // Return a success response with the updated overviewDetail
      return res.success(overviewPageList, req.__('LIST_OVERVIEW_DETAIL'));
    } catch (error) {
      // Return a server error response in case of an exception
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async addSubtoSubCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { parentId, childrenId, name } = params;
      const parentDetails = await SubCategory.findOne({ _id: parentId });
      console.log('sdfsdfdsf', parentDetails, childrenId);
      if (!parentDetails) {
        return res.warn({}, req.__('NO_PARENT_TO_ADD'));
      } else {

        const newSub = await SubCategory.create({
          name,
          parent: parentId,
        });
        // parentDetails.children = newSub._id;
        // } else {
        //     parentDetails.children = childrenId;
        // }
        // await parentDetails.save();
        return res.success(newSub, req.__('ADD_SUB_TO_SUB'));

      }
    } catch (error) {
      // Return a server error response in case of an exception
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async updateSubtoSubCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { _id, name } = params;
      const parentDetails = await SubCategory.findOne({ _id });

      if (parentDetails) {
        await SubCategory.updateOne(
          { _id },
          {
            $set: {
              name,
            },
          }
        );
      } else {
        return res.warn({}, req.__('NO_PARENT_TO_ADD'));
      }
      return res.success(parentDetails, req.__('UPDATE_SUB_TO_SUB'));
    } catch (error) {
      // Return a server error response in case of an exception
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  async getSubtoSubCategory(req, res) {
    try {
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );
      const { parentId } = params;
      const parentDetails = await SubCategory.findOne({ _id: parentId });
      const childrenList = await SubCategory.find({
        parent: parentDetails._id,
      }).populate('parent');
      return res.success(childrenList, req.__('LIST_OVERVIEW_DETAIL'));
    } catch (error) {
      // Return a server error response in case of an exception
      return res.serverError(error, req.__('GENERAL_ERROR'));
    }
  }

  // async buildTree(req, res) {
  //   try {
  //     // Fetch all categories
  //     const categories = await Category.find().lean();

  //     // Fetch all subcategories
  //     const subcategories = await SubCategory.find().lean();

  //     // Map subcategories to their parent categories
  //     const subcategoriesMap = subcategories.reduce((map, subcategory) => {
  //       const categoryId = subcategory.category
  //         ? subcategory.category.toString()
  //         : null;
  //       map[categoryId] = map[categoryId] || [];
  //       map[categoryId].push(subcategory);
  //       return map;
  //     }, {});

  //     // Map subcategories to their parent subcategories
  //     const parentSubcategoriesMap = subcategories.reduce(
  //       (map, subcategory) => {
  //         const parentId = subcategory.parent
  //           ? subcategory.parent.toString()
  //           : null;
  //         map[parentId] = map[parentId] || [];
  //         map[parentId].push(subcategory);
  //         return map;
  //       },
  //       {}
  //     );

  //     // Function to build the tree recursively
  //     function buildCategoryTree(category) {
  //       const categoryData = {
  //         label: category.name,
  //         value: category._id.toString(),
  //         children: [],
  //       };

  //       const subcategoryChildren =
  //         subcategoriesMap[category._id.toString()] || [];
  //       const parentSubcategories =
  //         parentSubcategoriesMap[category._id.toString()] || [];

  //       for (const subcategory of subcategoryChildren) {
  //         const subcategoryData = buildCategoryTree(subcategory);
  //         categoryData.children.push(subcategoryData);
  //       }

  //       for (const parentSubcategory of parentSubcategories) {
  //         const parentSubcategoryData = buildCategoryTree(parentSubcategory);
  //         categoryData.children.push(parentSubcategoryData);
  //       }

  //       return categoryData;
  //     }

  //     // Build the tree for each category
  //     const treeData = categories.map((category) =>
  //       buildCategoryTree(category)
  //     );

  //     return res.success(treeData, req.__('LIST_OVERVIEW_DETAIL'));
  //   } catch (error) {
  //     console.error('Error building tree:', error);
  //   }
  // }

  // async buildTree(req, res) {
  //   try {
  //     const params = _.extend(
  //       req.query || {},
  //       req.params || {},
  //       req.body || {}
  //     );
  //     console.log('req.params.type', params);
  //     // Extract type from req.params
  //     const { type } = params;

  //     // Validate type if needed
  //     if (!type) {
  //       // Handle the case where type is not provided
  //       return res.warn('Type parameter is missing.');
  //     }

  //     // Fetch categories of the specified type where the corresponding showin property is true
  //     const filter = {};
  //     filter[`showin${type.charAt(0).toUpperCase() + type.slice(1)}`] = true;
  //     const categories = await Category.find(filter).lean();

  //     // Fetch all subcategories
  //     const subcategories = await SubCategory.find().lean();

  //     // Map subcategories to their parent categories
  //     const subcategoriesMap = subcategories.reduce((map, subcategory) => {
  //       const categoryId = subcategory.category
  //         ? subcategory.category.toString()
  //         : null;
  //       map[categoryId] = map[categoryId] || [];
  //       map[categoryId].push(subcategory);
  //       return map;
  //     }, {});

  //     // Map subcategories to their parent subcategories
  //     const parentSubcategoriesMap = subcategories.reduce((map, subcategory) => {
  //       const parentId = subcategory.parent ? subcategory.parent.toString() : null;
  //       map[parentId] = map[parentId] || [];
  //       map[parentId].push(subcategory);
  //       return map;
  //     }, {});

  //     // Function to build the tree recursively
  //     function buildCategoryTree(category) {
  //       const categoryData = {
  //         label: category.name,
  //         value: category._id.toString(),
  //         children: [],
  //       };

  //       const subcategoryChildren =
  //         subcategoriesMap[category._id.toString()] || [];
  //       const parentSubcategories =
  //         parentSubcategoriesMap[category._id.toString()] || [];

  //       for (const subcategory of subcategoryChildren) {
  //         const subcategoryData = buildCategoryTree(subcategory);
  //         categoryData.children.push(subcategoryData);
  //       }

  //       for (const parentSubcategory of parentSubcategories) {
  //         const parentSubcategoryData = buildCategoryTree(parentSubcategory);
  //         categoryData.children.push(parentSubcategoryData);
  //       }

  //       return categoryData;
  //     }

  //     // Build the tree for each category
  //     const treeData = categories.map((category) => buildCategoryTree(category));

  //     return res.success(treeData, req.__('LIST_OVERVIEW_DETAIL'));
  //   } catch (error) {
  //     console.error('Error building tree:', error);
  //     // Handle the error appropriately, e.g., send an error response
  //     return res.warn('Error building tree');
  //   }
  // }

  async buildTree(req, res) {
    try {
      // Extract type from req.params
      const params = _.extend(
        req.query || {},
        req.params || {},
        req.body || {}
      );

      const { type } = params;

      // Validate type if needed
      if (!type) {
        // Handle the case where type is not provided
        return res.warn('Type parameter is missing.');
      }

      // Fetch categories based on the corresponding showin property for the given type
      const filter = {};
      if (type === 'Classifications') {
        filter.showinClassification = true;
      } else if (type === 'Antibiotics') {
        filter.showinAntibiotic = true;
      } else if (type === 'Guideline') {
        filter.showinGuidline = true;
      }
      else if (type === 'Decision') {
        filter.showinDecision = true;
      }
      else {
        // Handle other types or provide a default behavior
        return res.warn('Invalid or unsupported type.');
      }

      const categories = await Category.find(filter).lean();

      // Fetch all subcategories
      const subcategories = await SubCategory.find().lean();

      // Map subcategories to their parent categories
      const subcategoriesMap = subcategories.reduce((map, subcategory) => {
        const categoryId = subcategory.category
          ? subcategory.category.toString()
          : null;
        map[categoryId] = map[categoryId] || [];
        map[categoryId].push(subcategory);
        return map;
      }, {});

      // Map subcategories to their parent subcategories
      const parentSubcategoriesMap = subcategories.reduce((map, subcategory) => {
        const parentId = subcategory.parent ? subcategory.parent.toString() : null;
        map[parentId] = map[parentId] || [];
        map[parentId].push(subcategory);
        return map;
      }, {});

      // Function to build the tree recursively
      function buildCategoryTree(category) {
        const categoryData = {
          label: category.name,
          value: category._id.toString(),
          children: [],
        };

        const subcategoryChildren =
          subcategoriesMap[category._id.toString()] || [];
        const parentSubcategories =
          parentSubcategoriesMap[category._id.toString()] || [];

        for (const subcategory of subcategoryChildren) {
          const subcategoryData = buildCategoryTree(subcategory);
          categoryData.children.push(subcategoryData);
        }

        for (const parentSubcategory of parentSubcategories) {
          const parentSubcategoryData = buildCategoryTree(parentSubcategory);
          categoryData.children.push(parentSubcategoryData);
        }

        return categoryData;
      }

      // Build the tree for each category
      const treeData = categories.map((category) => buildCategoryTree(category));

      return res.success(treeData, req.__('LIST_OVERVIEW_DETAIL'));
    } catch (error) {
      console.error('Error building tree:', error);
      // Handle the error appropriately, e.g., send an error response
      return res.warn('Error building tree');
    }
  }


  async profile(req, res) {
    try {
      // const params = _.extend(req.query || {}, req.params || {}, req.body || {});
      const { user } = req;
      const admin = await Admin.findOne({ _id: user._id });
      console.log(admin);
      if (!admin) {
        return res.unauthorized(null, req.__("UNAUTHORIZED"));
      }

      return res.success(admin, req.__("PROFILE_DETAILS"));
    } catch (error) {
      console.log("Admin Profile Error", error);
      return res.warn(error, req.__("GENERAL_ERROR"));
    }
  }



}

module.exports = new AdminController();
