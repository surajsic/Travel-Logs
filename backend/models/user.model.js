const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    fullName:{type: String, require:true},
    email:{type: String, require:true},
    password:{type: String, require:true},
    createdOn:{ type:Date, require: Date.now()},
})

const User = new mongoose.model("User", userSchema);

module.exports= User; 