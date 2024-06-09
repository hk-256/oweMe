// console.log("./models/user.js");

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    upi: String,
    friends:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

module.exports = mongoose.model("User",userSchema);

