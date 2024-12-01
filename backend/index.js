require("dotenv").config();

const bcrypt = require("bcrypt")
const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const upload = require("./multer")  // middleware
const fs = require("fs")
const path = require("path")

const { authenticateToken } = require("./utilities");

const connectDb = require("./utils/db") //mongodb


const app = express();  //middleware
app.use(express.json()) 
app.use(cors({origin:"*"}))  //middleware

const PORT = 3000

const User= require("./models/user.model");
const TravelStory= require("./models/travelStory.model");
const { error } = require("console");


//Create-Account
app.post("/create-account", async (req,res)=>{
    const {fullName, email, password} = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({error: true, message:"All fields are required"})
    }

    const isUser = await User.findOne({email})

    if (isUser) {
        return res.status(400).json({error:true, message: "User Already Exists!!"})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
        fullName,
        email,
        password : hashedPassword,
    })

    await user.save();

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72h"
        }
)
    return res.status(201).json({error:false, 
        user: { fullName: user.fullName , email: user.email, },
        accessToken,
        message: "Registration Successfull!",
    })
})

//login
app.post("/login", async (req,res)=>{
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({message:"Email & Password are required"})
    }

    const user = await User.findOne({email})

    if (!user) {
        return res.status(400).json({message: "User Not Found"})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(400).json({message: "Invalid Credentials"})
    }

    const accessToken = jwt.sign({ userId:user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: "72h",
    }
    )

    return res.json({
        error:false,
        message: "Login Successfull", 
        user :{ fullName: user.fullName, email: user.email}, 
        accessToken
    })
})

//Get-user
app.get("/get-user", authenticateToken, async (req, res)=>{
    const { userId } = req.user;

    const isUser = await User.findOne({ _id: userId})

    if (!isUser) {
        return res.sendStatus(401)
    }

    return res.json({
        user :isUser,
        message:"",
    })
})

//Add Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res)=>{
    const {title, story, visitedLocation, imageUrl, visitedDate } = req.body;

    const { userId} = req.user;

    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({error: true, message: "All fields are required"})
    }

    //convert visited date from milliseconds to date object
    const parsedVisitedDate = new Date(parseInt(visitedDate))

    try {
        const travelStory = new TravelStory({
            title, 
            story, 
            visitedLocation,
            userId, 
            imageUrl, 
            visitedDate: parsedVisitedDate,
        })

        await travelStory.save()
        res.status(201).json({story: travelStory, message: "Added Successfully"})
    } catch (error) {
        res.status(400).json({error: true, message: error.message})
    }
})

//edit travel story
app.put("/edit-story/:id", authenticateToken, async (req, res)=>{
    const { id }= req.params;
    const { title, story, visitedLocation, imageUrl, visitedDate }= req.body;
    const {userId} = req.user;

    if (!title || !story || !visitedLocation || !visitedDate) {
        return res.status(400).json({error: true, message: "All fields are required"})
    }

    //convert visited date from milliseconds to date object
    const parsedVisitedDate = new Date(parseInt(visitedDate))

    try {
        // Find the story by id and check if it belongs to authenticaed user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId})

        if (!travelStory) {
            return res.status(404).json({error: true, message: "Travel Story not found"})
        }

        const placeHolderImgUrl = `http://localhost:3000/assets/logo.png`;

        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrl = imageUrl || placeHolderImgUrl;
        travelStory.visitedDate = parsedVisitedDate;

        await travelStory.save();
        res.status(200).json({story: travelStory, message:"Update Successfull"})
    } catch (error) {
        return res.status(500).json({error:true, message:error.message})
    }

})

//Get All Travel Stories
app.get("/get-all-stories", authenticateToken, async (req, res)=>{
    const { userId } = req.user;

    try {
        const travelStories = await TravelStory.find({ userId: userId}).sort({
            isFavourite: -1,
        })
        res.status(200).json({stories: travelStories})
    } catch (error) {
        res.status(500).json({error:true, message: error.message})
    }
})

//Delete Story
app.delete("/delete-story/:id", authenticateToken, async (req,res)=>{
    const {id}= req.params;
    const {userId}= req.user;

    try {
             // Find the story by id and check if it belongs to authenticaed user
             const travelStory = await TravelStory.findOne({ _id: id, userId: userId})

             if (!travelStory) {
                 return res.status(400).json({error: true, message: "Travel Story not found"})
             }

             //Delete travel story

             await travelStory.deleteOne({_id: id, userId: userId})

             //Extract the filename from the imageUrl

             const imageUrl = travelStory.imageUrl
             const filename= path.basename(imageUrl)

             //Define the file path
             const filePath = path.join(__dirname, 'uploads', filename)

             //Delete the image from the uploads folder
             fs.unlink(filePath, (err)=>{
                if (err) {
                    console.log("Failed to delete image file", err)
                }
             })

             res.status(200).json({message: "Travel STory Deleted Successfully"})
     
    } catch (error) {
        
    }
})
    

//Route to Handle Image Upload
app.post("/image-upload", upload.single("image"), async (req, res)=>{
    try {
        if (!req.file) {
            return res.status(400).json({error:true, message: "No image Uploaded"})
        }

        const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`

        res.status(200).json({ imageUrl })
    } catch (error) {
        res.status(500).json({erro: true, message: error.message})
    }
})


//Delete an image from uploads folder
app.delete("/delete-image", async (req,res)=>{
    const {imageUrl}= req.query;

    if (!imageUrl) {
        return res.status(400).json({error:true, message: "Image URL parameter is required"})
    }

    try {
        // extract the filename from the image url
        const filename = path.basename(imageUrl)

        //delete the file path
        const filePath = path.join(__dirname, 'uploads', filename)

        //check if file exists 
        if (fs.existsSync(filePath)) {

            //delete the file from the uploads folder
            fs.unlinkSync(filePath)
            res.status(200).json({ message: "Image Deleted Successfully" })
        } else {
            res.status(200).json({ error: true, message: "Image not found"})
        }
    } catch (error) {
        res.status(500).json({ error:true, message: error.message})
    }
})

//Update isFavourite
app.put("/update-isFav/:id", authenticateToken, async(req,res)=>{
    const {id}= req.params;
    const { isFavourite }= req.body
    const { userId }= req.user;
    try {
        const travelStory = await TravelStory.findOne({_id: id, userId: userId})

        if (!travelStory) {
            return res.status(404).json({error:true, message:"Travel Story not found"})
        }

        travelStory.isFavourite = isFavourite;

        await travelStory.save();
        res.status(200).json({story: travelStory, message:"Update Successfull"})
    } catch (error) {
        res.status(500).json({error:true, message: error.message})
    }
})

//Search Travel Stories
app.get("/search", authenticateToken, async(req,res)=>{
    const { query } = req.query;
    const {userId}= req.user;

    if (!query) {
        return res.status(404).json({error:true, message:"Query is required"})
    }

    try {
        const searchResults = await TravelStory.find({
            userId: userId,
            $or:[
                {title: {$regex: query, $options: "i"}},
                {story: {$regex: query, $options: "i"}},
                {visitedLocation: {$regex: query, $options: "i"}},
            ]
        }).sort({isFavourite: -1})

        res.status(200).json({stories: searchResults})
    } catch (error) {
        res.status(500).json({error:true, message: error.message})
    }
})

//Filter Travel Stories
app.get("/travel-stories/filter", authenticateToken, async(req,res)=>{
    const {startDate, endDate} = req.query;
    const {userId}= req.user;

    try {
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));

        const filteredStories = await TravelStory.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end },
        }).sort({ isFavourite: -1 })

        res.status(200).json({stories: filteredStories})
    } catch (error) {
        res.status(500).json({error:true, message: error.message})
    }
})

//Serve static files from uploads and assets directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/assets", express.static(path.join(__dirname, "assets")))


connectDb().then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is running at http://localhost:${PORT}`);
    }); 
})


module.exports = app;