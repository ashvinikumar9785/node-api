const {
    models: { Video },
} = require('../../../../lib/models');
const _ = require('lodash');
const youtubeThumbnail = require('youtube-thumbnail');


class VideoController {

    async addVideo(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { name, description, url } = params;

            const thumbnail = youtubeThumbnail(url);
            let newVideo = await Video.create({
                name, description, url, thumbnail: thumbnail.high.url
            });

            return res.success(newVideo, req.__('ADD_ENQUIRY'));
        }
        catch (error) {
            console.log('Add Video Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async getVideo(req, res) {
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
                        {
                            $sort: { created: -1 }
                        }
                    ]
                    : []),
            ];

            let totalRecordsResult = await Video.aggregate(countPipeline);
            let subsetResult = await Video.aggregate(subsetPipeline);
            response.totalRecords = totalRecordsResult.length > 0 ? totalRecordsResult[0].totalRecords : 0;
            response.videoList = subsetResult;

            return res.success(response, req.__('LIST_VIDEO'));
        }
        catch (error) {
            console.log('Get Video Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async getVideoDetail(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { videoId } = params;

            const videoDetail = await Video.findOne({
                _id: videoId
            })

            return res.success(videoDetail, req.__('VIDEO_DETAIL'));
        }
        catch (error) {
            console.log('Get Video Detail Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async deleteVideo(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { videoId } = params;
            const checkIfExits = await Video.findOne({
                _id: videoId
            });

            if (!checkIfExits) {
                return res.warn({}, req.__('NO_VIDEO'));
            }

            const videoDetail = await Video.deleteOne({
                _id: videoId
            });

            return res.success(videoDetail, req.__('VIDEO_DELETED'));
        }
        catch (error) {
            console.log('Delete Video Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }

    async updateVideoDetail(req, res) {
        try {
            const params = _.extend(req.query || {}, req.params || {}, req.body || {});
            const { _id, name, url, description } = params;
            const video = await Video.findOne({ _id });
            if (!video) {
                return res.serverError({}, req.__('NO_VIDEO'));
            }
            video.name = name;
            video.url = url;
            video.description = description;
            video.save();
            return res.success(video, req.__('VIDEO_UPDATED'));
        }
        catch (error) {
            console.log('Update Video Error', error);
            return res.serverError(error, req.__('GENERAL_ERROR'));
        }
    }
}





module.exports = new VideoController();