// console.log("./models/user.js");

const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const groups = require('./groups');

const userSchema = mongoose.Schema({
    upi: {
        type: String,
        required: true,
        unique: true
    },
    friends:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    incomingRequest:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    outgoingRequest:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    groups:[{
            group:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Group"
            },
            owe:{
                type: Number,
                default: 0
            }
        }]    
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);

