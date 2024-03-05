const express = require('express');
const router = express.Router();
const validations = require('./admin.validation');
const { validate } = require('../../utils/validations');
const { upload } = require('../../utils/upload');
// const { imageValidatior } = require('../../utils/imageValidator');
const { verifyToken } = require('../../utils/auth');

// ------------------------------------------------------------------Controllers
const AuthController = require('./auth.controller');
const UserController = require('./user.controller');
const VideoController = require('../api/video.controller');
const AdminController = require('./admin.controller');

// ------------------------------------------------------------------Auth Routes

router.post('/create-account', validate(validations.signUp), upload.single('avatar'), AuthController.createAccount);
router.post('/login', validate(validations.logIn), AuthController.login);
router.post('/social-login', validate(validations.socialLogIn), AuthController.socialLogIn);
router.post('/social-log-in', validate(validations.socialLogInWithoutVerify), AuthController.socialLogInWithoutVerify);
router.post('/forgot-password', validate(validations.forgotPassword), AuthController.forgotPassword);
router.post('/verify-otp', validate(validations.resetPassword), AuthController.verifyOTP);
router.post('/reset-password', validate(validations.resetPassword), AuthController.resetPassword);
router.get('/log-out', verifyToken, AuthController.logout);
// router.post('/update-profile', upload.single('avatar'), AuthController.updateProfile);
router.post('/change-password', verifyToken, AuthController.changePassword);
router.post('/update-profile', upload.single('image'), verifyToken, AuthController.updateProfile);
router.get('/profile', verifyToken, AdminController.profile);

// ------------------------------------------------------------------User Routes

router.get('/get-enquiry', UserController.getEnquiry);
router.post('/add-refrences', UserController.addRefrences);

// ------------------------------------------------------------------Video Routes

router.post('/add-video', VideoController.addVideo);
router.get('/get-video', VideoController.getVideo);
router.get('/get-video-detail/:videoId', VideoController.getVideoDetail);
router.put('/update-video-detail', VideoController.updateVideoDetail);
router.delete('/delete-video', validate(validations.deleteVideo, 'query'), VideoController.deleteVideo);


// ------------------------------------------------------------------Util Routes
router.get('/get-static-pages', upload.single('image'), AdminController.getStaticPages);
router.post('/create-static-pages', upload.single('image'), AdminController.addStaticPage);
router.put('/update-static-pages', upload.single('image'), AdminController.updateStaticPage);
router.get('/detail-static-pages/:_id', AdminController.detailStaticPage);

// ------------------------------------------------------------------Refrences Routes
router.get('/get-refrences', AdminController.getRefrences);
router.post('/add-refrences', AdminController.addRefrences);

// ------------------------------------------------------------------Category Routes
router.post('/add-category', upload.single('image'), validate(validations.addCategory), AdminController.addCategory);
router.put('/update-category', upload.single('image'), validate(validations.updateCategory), AdminController.updateCategory);
router.get('/get-category', AdminController.getCategory);
router.delete('/delete-category/:_id', AdminController.deleteCategory);
router.get('/selected-category/:type', AdminController.selectedCategory);

// ------------------------------------------------------------------sub category Routes
router.post('/add-sub-category', upload.single('image'), AdminController.addSubCategory);
router.get('/get-sub-category', AdminController.getSubCategory);
router.post('/update-sub-category', upload.single('image'), AdminController.updateSubCategory);
router.delete('/delete-sub-category/:_id', AdminController.deleteSubCategory);

// ------------------------------------------------------------------add sub to sub category Routes
router.post('/add-sub-to-sub', AdminController.addSubtoSubCategory);
router.put('/update-sub-to-sub', AdminController.updateSubtoSubCategory);
router.get('/get-sub-to-sub', AdminController.getSubtoSubCategory);

// ------------------------------------------------------------------Chapter Routes
router.get('/get-chapters/:type', AdminController.getChapters);
router.post('/add-chapter', upload.single('image'), AdminController.addChapter);
router.put('/update-chapter', upload.single('image'), AdminController.updateChapter);
router.delete('/delete-chapter/:chapterId', AdminController.deleteChapter);
router.patch('/update-chapter-status', AdminController.updateChapterStatus);

// ------------------------------------------------------------------Overview Routes
router.get('/get-overview', AdminController.getOverview);
router.get('/get-overview-list', AdminController.getOverviewList);
router.post('/add-to-overview-list', validate(validations.addtoOverviewList), AdminController.addtoOverviewList);
router.get('/get-overview-detail-list', AdminController.getOverviewDetailList);
router.get('/get-tree-list', AdminController.buildTree);

module.exports = router;
