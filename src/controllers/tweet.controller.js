import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";


const createTweet = asyncHandler (async (req,res)=>{
    const { content } = req.body;
    if(!content || content.trim() ==="") throw new ApiError(400 , "Content is required");
    
    const user = await User.findById(req.user?._id , {_id : 1})

    if(!user) throw new ApiError(400 , "User not found");

    const tweet = await Tweet.create({
        content,
        owner : req.user?._id
    })

    if(!tweet) throw new ApiError(400 ,"Something went wrong while creating tweet");

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                tweet,
                "Tweet creeated successfully"
            )
        )
})

const getAllTweet = asyncHandler(async(req,res)=>{
    const { userId }= req.params
    if (!userId) throw new ApiError(404, "userId is required");
    if (!isValidObjectId(userId)) throw new ApiError(404, "UserId not valid");

    const { page =1 , limit =10} = req.query;
    const user = await User.findById(userId).select("_id");
    if (!user) throw new ApiError(404, "User not found");

    const tweeetAggregate = Tweet.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(user?._id)
            }
        },

        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner" ,
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : "$avatar.url",
                            fullName : 1,
                            _id : 1
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

        {
            $sort : {
                createdAt : -1
            }
        }
    ])

    if(!tweeetAggregate) throw new ApiError(404 , " Tweets not found")

    const options = {
        page : parseInt(page),
        limit : parseInt(float),
        customLabels : {
            totalDocs : "totalTweets",
            docs : "tweets"
        },
        $skip : (page-1) * limit
    }

    Tweet.aggregatePaginate(
        tweeetAggregate,
        options
    )
    .then(
        result =>{
            if(result.length === 0) {
                return res
                .status(200)
                .json(
                    new ApiResponse(200,
                        [],
                        "No tweets Found"
                    )
                )
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(200,
                        result,
                        "Tweet Fetched Successfully"
                    )
                )
        }
    )

    .catch(error=>{
        console.error("Error in aggregation:" , error)
        throw new ApiError(500 , error?.message || "Internal server Erroe in Tweet aggregation" )
    })

})

const updateTweet = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) throw new ApiError(404, "Not found tweet for this id")
    const user = await User.findById(req.user?._id, { _id: 1 });
    if (!user) throw new ApiError(404, "User not found");

    const tweet = await Tweet.findById(tweetId, { _id : 1});
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if(!content || content?.trim() === "") throw new ApiError(404, "content is required");


    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {
            new : true
        }
    )

    if(!updatedTweet) throw new ApiError(500, "Something went wrong while updating tweet")

    return res.status(201)
        .json(new ApiResponse(
            201,
            updatedTweet,
            "tweet updated Successfully"
    ))
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params;

    const user = await User.findById(req.user?._id, { _id: 1 });
    if (!user) throw new ApiError(404, "User not found");

    if (!isValidObjectId(tweetId))
        throw new ApiError(404, "Not found tweet for this id")

    const tweet = await Tweet.findById(tweetId, { _id: 1 });
    if (!tweet) throw new ApiError(404, "Tweet not found");


    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if(!deletedTweet) throw new ApiError(500, "Something went wrong while deleting tweet")

    return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "tweet deleted successfully"
    ))
})


export { createTweet , getAllTweet , updateTweet , deleteTweet }