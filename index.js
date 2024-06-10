const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const flash =  require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");


const MongoStore = require("connect-mongo");

const User = require("./models/user");


app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,"public")));
app.engine("ejs",ejsMate);



const dbUrl = 'mongodb://127.0.0.1:27017/OweMe'
// const dbUrl = 

mongoose.connect(dbUrl)
  .then(()=>{
    console.log("connected");
  })
  .catch((err)=>{
    console.log("there is an error in connecting");
    console.log(err);
  })

  const sessionConfig = {
    name: "session",
    secret: "fuckthishit",
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge:  1000*60*60*24*7
    }
}



app.use(session(sessionConfig));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.listen(5500,()=>{
    console.log("started listening to the port 5500");
})


const isLoggedIn = (req,res,next)=>{

    if(!req.user){
        req.flash("error","you must be logged in first");
        res.redirect("/login");
    }
    else{
        next();
    }


}

app.use((req,res,next)=>{
    res.locals.currUser = req.user || "Not one logged in";
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();

})


app.get("/",async (req,res)=>{
    const users = await User.find();
    res.render("home",{users});
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.post("/login",passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}),(req,res)=>{

    req.flash("success","you are logged in");
    res.redirect(`/user/${req.user._id}`);

})


app.get("/register",(req,res)=>{

    res.render("register");

})

app.post("/register", async (req,res,next)=>{
    try{
    const {username,password,upi} = req.body;
    const user = new User({username,upi});
    const registeredUser = await User.register(user,password);

    req.flash("success","you are registered succeffully");
    res.redirect("/");
    }
    catch(e){
        req.flash("error","some error occured in register");
        res.redirect('/');
    }


})

app.get("/logout",(req,res)=>{

    req.logout((e)=>{
        if(e){
            req.flash("error","error occured while logout");
            next(e);
        }

        res.redirect("/");

    })

})


app.get("/profile",isLoggedIn,(req,res)=>{

    res.redirect(`/user/${req.user._id}`);

})

app.get("/user/:id", async (req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id).populate("friends","username");
    res.render("profile",{user});

})

app.get("/makeFriend/:id", async (req,res)=>{
    const user = await User.findById(req.params.id);

    user.friends.push(req.user);
    req.user.friends.push(user);

    await user.save();
    await req.user.save();

    res.redirect(`/user/${req.user._id}`);
})

app.post('/search', async (req,res)=>{
    const {search} = req.body;
    // res.send(search);
    const users = await User.find({
        'username': {
            '$regex': search,
            '$options': 'i'
        }
    });
    res.render("home",{users});
})


app.use((err,req,res,next)=>{
    res.send(err);
})