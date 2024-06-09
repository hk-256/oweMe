const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");


// models
const User = require("./models/user");


app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,"public")));
app.engine("ejs",ejsMate);



const dbUrl = 'mongodb://127.0.0.1:27017/OweMe'
mongoose.connect(dbUrl)
  .then(()=>{
    console.log("connected");
  })
  .catch((err)=>{
    console.log("there is an error in connecting");
    console.log(err);
  })



app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.listen(5500,()=>{
    console.log("started listening to the port 5500");
})



app.get("/",async (req,res)=>{
    const users = await User.find();
    res.render("home",{users});
})



app.get("/createUser",(req,res)=>{

    res.render("createUser");

})

app.post("/createUser", async (req,res)=>{
    const user = new User(req.body.user);
    await user.save();
    res.redirect("/createUser");
})

app.get("/user/:id", async (req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id);
    res.render("showUser",{user});

})