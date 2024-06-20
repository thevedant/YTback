import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })

        //file uploaded succesfully
        // console.log("file uploaded successfully on cloudinary" , response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        // remove the locally saved files as opn got failed
        return null
    }
}

const delelteOnCloudinary = async(oldImageUrl , publicId)=>{
    try{
        if (!(oldImageUrl || publicId)) throw new ApiError(404, "oldImageUrl or publicId required");
        const result = await cloudinary.uploader.destroy(
            publicId,
            { resource_type : `${oldImageUrl.includes("image")?"image" : "video"} `},
        )
        console.log("Asset deleted from Cloudinary:", result)
    }
    catch{

    }
}


export { uploadOnCloudinary ,delelteOnCloudinary }