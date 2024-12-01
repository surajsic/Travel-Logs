const mongoose= require("mongoose")

const URI= "mongodb://127.0.0.1:27017/travel-app"

//const URI = process.env.MONGODB_URI;
//mongoose.connect(URI)

const connectDb = async ()=>{
    try {
        await mongoose.connect(URI);
        console.log("Connection to DB Successfull");
    } catch (error) {
        console.log("Database not connected");
        process.exit(0);
    }
}

module.exports = connectDb;