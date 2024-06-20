import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name){
        throw new ApiError(400 , "Name is required")
    }

    const playlist = await Playlist.create(
        {
            name,
            description
        }
    )

    if(!playlist){
        throw new ApiError(400 , " Something went wrong while creating playlist ")
    }

    playlist.owner = req.user?._id
    await playlist.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200 , playlist , "PlayList Created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!videoId || !playlistId) throw new ApiError(400 , "Please provide playist and video Id");
    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) throw new ApiError(401, "Invalid video or playlist Id");

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist Not found")
    }

    if(playlist?.video?.includes(videoId)){
        playlist.video.push(videoId);
        await playlist.save();
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 , playlist , "Added video to PlayList")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) throw new ApiError(401, "Invalid video or playlist Id");

    const video = await Video.findById(videoId , { _id : 1 })
    if (!video) throw new ApiError(404, "video not found");

    const playlist = await Playlist.findById(playlistId, { _id: 1, videos: 1 });
    if (!playlist) throw new ApiError(404, "Playlist Not found");

    const isVideoInPlaylist = await Playlist.findOne({
        _id : playlistId,
        videos : videoId
    })

    if(!isVideoInPlaylist){
        throw new ApiError(404, "Video nOt in playlist")
    }

    const removedVideoPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos : videoId
            }
        },
        {
            new :true
        }
    )

    if (!removedVideoPlaylist) throw new ApiError(500, "playlist not updated");
    return res.status(200)
        .json(new ApiResponse(
            200,
            removedVideoPlaylist,
            "Video removed from playlist successfully"
        ))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) throw new ApiError(401, "Invalid playlist Id");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "playlist not found");

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist) throw new ApiError(500, "playlist not deleted");
    return res.status(200)
        .json(new ApiResponse(
            200,
            deletedPlaylist,
            "Playlist deleted successfully"
        ))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) throw new ApiError(401, "Invalid playlist Id");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "playlist not found");

    if (!(name || description) || !(name?.trim() !== "" || description?.trim() !== "")) throw new ApiError(400, "name or description required");
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )
    if (!updatedPlaylist) throw new ApiError(500, "playlist not updated");
    return res.status(200)
        .json(new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist updated successfully"
        ))
})

export {createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist }