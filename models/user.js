// console.log("./models/user.js");

const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
    upi: {
        type: String,
        required: true,
        unique: true
    },
    friends:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);

