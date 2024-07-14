// console.log("./models/user.js");

const mongoose = require('mongoose');


const groupSchema = mongoose.Schema({
    
    groupName : {
        type: String,
        required: true
    },
    groupMembers:[{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        owe: {
            type: Number,
            default: 0
        }
    }],
    message:[{
        msg:{
            type: String
        },
        user:{
            type: String
        }
    }]    
});


module.exports = mongoose.model("Group",groupSchema);

