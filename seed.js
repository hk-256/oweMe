
//console.log('seed.js');
const mongoose = require("mongoose");

const User = require("./models/user");
const Group = require("./models/groups");
const { create } = require("connect-mongo");


const dbUrl = 'mongodb://127.0.0.1:27017/OweMe'
// const dbUrl = 

mongoose.connect(dbUrl)
  .then(async ()=>{
    console.log("connected");
        
    async function deleteAll(){
        await User.deleteMany({});
        await Group.deleteMany({});
        console.log("deleted successfully");
    }

    await deleteAll();
    await mongoose.disconnect();
    console.log("disconnected");
  })
  .catch((err)=>{
    console.log("there is an error in connecting");
    console.log(err);
  })

