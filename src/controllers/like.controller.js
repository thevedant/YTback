import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js"


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(404 , "Invalid Video Id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404 , "Video Not found with given ID")
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const isLiked = await Like.findOne({ video : videoId , likedBy : user?._id })
    let videoLikedStatus;

    try {
        if(!isLiked){
            await Like.create({
                video : videoId,
                likedBy : user?._id
            })
            videoLikedStatus = { isLiked : true }
        }else{
            await Like.deleteOne(isLiked._id)
            videoLikedStatus = { isLiked : false }
        }
    } catch (error) {
        throw new ApiError(400 , "Error while toggle video like", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videolikeStatus, "Video Like Toggle sucessfull")
        )
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "commentId is not available")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found with this commentId or Invalid commentId")
    }

    if (!req.user?._id) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)
    if (!isValidObjectId(user)) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const isLiked = await Like.findOne({ comment: commentId, likedBy: user?._id })

    let commentlikeStatus;
    try {
        if (!isLiked) {
            await Like.create({
                comment: commentId,
                likedBy: user?._id
            })

            commentlikeStatus = { isLiked: true }
        }
        else {
            await Like.deleteOne(isLiked._id)
            commentlikeStatus = { isLiked: false }
        }

    } catch (error) {
        throw new ApiError(400, "Error while toggle comment like", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, commentlikeStatus, "Comment Like Toggle sucessfully")
        )
})

const toggleTweetLike = asyncHandler(async (req,res)=>{
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweetId is not available")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found with this commentId or Invalid tweetId")
    }

    if (!req.user?._id) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)
    if (!isValidObjectId(user)) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const isLiked = await Like.findOne({ tweet: tweetId, likedBy: user?._id })

    let tweetlikeStatus;
    try {
        if (!isLiked) {
            await Like.create({
                tweet: tweetId,
                likedBy: user?._id
            })

            tweetlikeStatus = { isLiked: true }
        }
        else {
            await Like.deleteOne(isLiked._id)
            tweetlikeStatus = { isLiked: false }
        }

    } catch (error) {
        throw new ApiError(400, "Error while toggle tweet like", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, commentlikeStatus, "tweet Like Toggle sucessfully")
        )
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    if(!req.user?._id){
        throw new ApiError(400 , "Req User ID Not found")
    }

    const user = await User.findById(req.user?._id)
    if (!isValidObjectId(user)) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const likedVideos = await Like.aggregate(
        [
            {
                $match:{
                    likedBy : new mongoose.Types.ObjectId(req.user?._id)
                }
            },

            {
                $match:{
                    video:{
                        $exists:true
                    }
                }
            },

            {
                $lookup:{
                    from : "videos",
                    localField : "videos",
                    foreignField : " _id",
                    as: "video",
                    pipeline:[
                        {
                            $project : {
                                video: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                owner: 1,
                            }
                        },

                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : " _id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },

                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        },
                    ]
                }
            }
        ]
    )

    return res
        .status(200)
        .json(
            new  ApiResponse(200, likedVideos, "All liked Videos fetched sucessfully")
        )
})


export { toggleVideoLike , toggleCommentLike ,toggleTweetLike ,getLikedVideos }