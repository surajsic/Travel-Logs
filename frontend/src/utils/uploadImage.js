import axiosInstance from "./axiosInstance"

const uploadImage = async (imageFile) =>{
    const formData = new FormData();
    // Append image file to form data
    formData.append("image", imageFile)

    try {
        const response = await axiosInstance.post("http://localhost:3000/image-upload", formData, {
            headers:{
                "Content-Type": "multipart/form-data", //Set header file for file upload
            },
        });

        return response.data; // Return response data
    } catch (error) {
        console.log("Error Uploading image", error)
        throw error;
    }
}

export default uploadImage;