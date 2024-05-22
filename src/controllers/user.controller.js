import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";




const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()

        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save( { validateBeforeSave : false } )

        return { accessToken , refreshToken }
    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler( async(req, res)=>{
    
    // get user detail from frontend
    //validation - not empty
    // check if alredy exist : username and email
    // check for images and avatar
    // upload to cloudinary , avatar
    // create user object in DB
    // remove pwd and refresh token field from response
    // check for user creation
    // return res

    const {fullName , username , email , password } = req.body
    //console.log("email:" ,email);


    //Noob aaproach
    /*if(fullName === ""){
        throw new ApiError(400, "full name is required")
    }*/

    if(  [fullName , username , email , password ].some((field)=>field?.trim === "")  ){
        throw new ApiError (400 , "All fields are compulsory")
    }

    const existedUser =await User.findOne({
        $or:[{ username } , { email }]
    })

    if(existedUser){
        throw new ApiError (409 , "User with email or username already exist")
    }

    // console.log(req.files);


    const avatarLocalPath = req.files?.avatar[0]?.path;

    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)  && req.files.coverImage.length > 0 ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar to lagega hi lagega")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError (400 , " Bhai avatar chaiye samjh nhi a rha kya");
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url|| "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // - mtlb jo jo nhi lena h
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering user")
    }

    return  res.status(201).json(
        new ApiResponse(200 , createdUser , "User created successfully ")
    )
} )


const loginUser = asyncHandler(async (req, res )=>{
    // take data
    // username or email
    //find user
    //password check
    //access and refresh token
    // send cookies

    const {email , username , password} = req.body

    if(!(username || email)){
        throw new ApiError(400 , "username or email is required")
    }

    const user = await User.findOne({
        $or:[ { username } , { email } ]
    })

    if(!user){
        throw new ApiError(400 , "User dont exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 , " Incorrect password")
    }

    const { accessToken , refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly :true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken ,options)
    .cookie("refreshToken" , refreshToken ,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser ,accessToken , refreshToken
            },
            "user logged in successfully"
        )
    )


})


const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly :true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User loggedOut successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 ,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401 ,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 ,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure :true
        }
    
        const { accessToken , newRefreshToken } =await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken ,options)
        .cookie("refreshToken" , newRefreshToken ,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken : newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }
})


export { registerUser , loginUser , logoutUser , refreshAccessToken }