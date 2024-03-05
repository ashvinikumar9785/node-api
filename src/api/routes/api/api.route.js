const express = require('express');
const router = express.Router();
const validations = require('./api.validation');
const { validate } = require('../../utils/validations');
const { upload } = require('../../utils/upload');
const { imageValidatior } = require('../../utils/imageValidator');

// ------------------------------------------------------------------Controllers
const UtilController = require('./util.controller');
const VideoController = require('./video.controller');
const GuildlineController = require('./guidlines.controller');
const DecisionController = require('./decision.controller');
const AntibioticController = require('./antibiotic.controlller');
const ClassificationController = require('./classification.controller');
const OvewrviewController = require('./overview.controller');

// ------------------------------------------------------------------Util Routes

router.post('/add-enquiry', validate(validations.enquiry), UtilController.addEnquiryQuery);
router.post('/add-home-icon', upload.single('image'), imageValidatior, validate(validations.home), UtilController.addHomeIcons);
router.get('/get-home-items', UtilController.getHomeIcons);
router.get('/static-pages/:type', UtilController.previewStaticPage);
router.get('/view-page/:type', UtilController.viewStaticPage);

// ------------------------------------------------------------------Video Routes
router.post('/add-video', VideoController.addVideo);
router.get('/get-video', VideoController.getVideo);

// ------------------------------------------------------------------Guildline Routes

router.get('/get-guidlines', GuildlineController.getGuidlines);
router.get('/list-guidlines/:guidelineId', GuildlineController.listGuidlines);
// router.get('/detail-guidlines/:pageId', GuildlineController.detailGuidline);

// ------------------------------------------------------------------Decision Routes
// router.post('/add-decision', upload.single('image'), imageValidatior, validate(validations.guidline), DecisionController.addDecision);
// router.delete('/delete-decisions', DecisionController.getDecisions);
// router.post('/add-to-decision', upload.single('image'), DecisionController.addDecisionPages);
router.get('/get-decisions', DecisionController.getDecisions);
router.get('/list-decision/:decisionId', DecisionController.listDecisions);
// router.get('/detail-decision/:pageId', DecisionController.detailDecision);

// ------------------------------------------------------------------Refrences Routes
router.get('/get-refrences', UtilController.getRefrences);

// ------------------------------------------------------------------Anitibotic Routes
// router.post('/add-antibiotic', upload.single('image'), imageValidatior, validate(validations.guidline), AntibioticController.addAntibiotic);
// router.post('/add-to-antibiotic', upload.single('image'), AntibioticController.addAntibioticPages);
router.get('/get-antibiotic', AntibioticController.getAntibiotic);
router.get('/list-antibiotic/:antibioticId', AntibioticController.listAntibiotic);
// router.get('/detail-antibiotic/:pageId', AntibioticController.detailAntibiotic);

// ------------------------------------------------------------------Anitibotic Routes
// router.post('/add-classification', upload.single('image'), imageValidatior, validate(validations.guidline), ClassificationController.addClassification);
// router.post('/add-to-classification', upload.single('image'), ClassificationController.addClassificationPages);
router.get('/get-classification', ClassificationController.getClassification);
router.get('/list-classification/:classificationId', ClassificationController.listClassification);
// router.get('/detail-classification/:pageId', ClassificationController.detailClassification);


// ------------------------------------------------------------------Util Routes
router.get('/search', validate(validations.search, 'query'), UtilController.searchData);
router.get('/get-overview', OvewrviewController.getOverview);
router.get('/get-overview-list', OvewrviewController.getOverviewList);
// router.get('/get-overview-chapter-list', OvewrviewController.getOverviewChapterList);
router.get('/detail-overview/:pageId', OvewrviewController.detailOverview);
// router.get('/detail-search/:overviewId/:pageId', UtilController.detailSearchPage);
// router.get('/get-overview-chapter-list', OvewrviewController.getOverviewChapterList);
router.get('/get-nested-childs/:parentId', UtilController.getNestedChild);
router.get('/detail-page/:pageId', UtilController.detailPage);
router.get('/view-detail/:pageId', UtilController.viewDetailPage);

module.exports = router;
