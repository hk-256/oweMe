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
const bodyParser = require("body-parser");


const MongoStore = require("connect-mongo");

const User = require("./models/user");
const Group = require("./models/groups");


app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,"public")));
app.engine("ejs",ejsMate);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


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
        // req.flash("error","you must be logged in first");
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

app.get("*",isLoggedIn,(req,res,next)=>{
    next();
})



app.get("/logout",(req,res)=>{

    req.logout((e)=>{
        if(e){
            req.flash("error","error occured while logout");
            next(e);
        }
        req.flash("success","You are Logged out successfully");
        res.redirect("/login");

    })

})


app.get("/profile",isLoggedIn,(req,res)=>{

    res.redirect(`/user/${req.user._id}`);

})

app.get("/user/:id", async (req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id)
                            .populate("friends","username")
                            .populate({
                                path: "groups.group",
                                select: "groupName"
                            })
                            .populate("incomingRequest","username")
                            .populate("outgoingRequest","username");

    var isFriend = false;

                            

    for(let friend of user.friends){
        if(friend._id.equals(req.user._id)){
            isFriend = true;
            break;
        }
    }
    for(let friend of user.incomingRequest){
        if(friend._id.equals(req.user._id)){
            isFriend = true;
            break;
        }
    }

    res.render("profile",{user,isFriend});

})


app.get("/sendRequest/:id", async (req,res)=>{

    const user = await User.findById(req.params.id);
    
    user.incomingRequest.push(req.user);
    req.user.outgoingRequest.push(user);
    await user.save();
    await req.user.save();
    res.redirect(`/user/${req.user._id}`);

})

app.get("/deleteRequest/:id", async (req,res)=>{

    const user = await User.findById(req.params.id);
    user.incomingRequest.remove(req.user);
    req.user.outgoingRequest.remove(user);
    await user.save();
    await req.user.save();
    res.redirect(`/user/${req.user._id}`);

})

app.get("/makeFriend/:id", async (req,res)=>{
    // res.send("request came");
    const user = await User.findById(req.params.id);

    user.friends.push(req.user);
    req.user.friends.push(user);

    req.user.incomingRequest.remove(user);
    user.outgoingRequest.remove(req.user);

    console.log(user);
    console.log(req.user);

    await user.save();
    await req.user.save();

    res.redirect(`/user/${req.user._id}`);
})


app.get("/search",(req,res)=>{
    const users = []
    res.render("search",{users});
})

app.get('/search/:search', async (req,res)=>{
    const {search} = req.params;
    const users = await User.find({
        'username': {
            '$regex': search,
            '$options': 'i'
        }
    }).limit(10);

    if(users.length === 0){
        res.locals.error = `no user found named ${search}`;
    }

    res.render("search",{users});
})

//groups -> start

app.get("/groups",async (req,res)=>{
    // const user = await User.findById(req.user._id).populate("groups","groupName");
    const user = await User.findById(req.user._id).populate({
        path: "groups.group",
        select: "groupName"
    });
    const groups = user.groups;
    // // res.send(groups);
    // console.dir(groups);
    // res.send("ok");
    // res.send(groups);
    res.render("groups",{groups});
})

app.get("/groups/create",async (req,res)=>{
    const user = await User.findById(req.user._id).populate("friends","username");
    const Friends = user.friends;
    res.render("createGroup",{Friends});
})

app.post("/groups/create",async (req,res)=>{
    const {users,groupName} = req.body;
    const G = new Group({groupName});
    users.push(req.user._id);
    for(let userID of users){
        const X = await User.findById(userID);
        G.groupMembers.push({
            user : X
        });
        X.groups.push({
            group: G
        });
        await X.save();
    }
    G.save();
    res.redirect(`/groups/${G._id}`);
})
// so this is the fetch request ---->>>
app.post("/groups/:id/putMessage",async (req,res)=>{

    const group = await Group.findById(req.params.id);
    const data = req.body;
    group.message.push(data);
    await group.save();

    res.send("All done");
})

app.get("/groups/:id/pay",async (req,res)=>{

    const group = await Group.findById(req.params.id).populate({
        path: "groupMembers.user",
        select: "username"
    });

    res.render("groupPay.ejs",{group});

})

app.get("/groups/:id/preview",async (req,res)=>{

    const group = await Group.findById(req.params.id).populate({
        path: "groupMembers.user",
        select: "username"
    });

    res.render("preview.ejs",{group});

})

app.post("/groups/:id/pay",async (req,res)=>{
    const group = await Group.findById(req.params.id);
    const {inputs} = req.body;
    const result = Object.keys(inputs).map((key) => [key, inputs[key]]);
    let sum = 0;
    for(let X of result){
        sum+=Number(X[1]);
    }
    result.push([req.user._id,sum]);

    for(let input of result){
        const user = await User.findById(input[0]);
        var value = Number(input[1]);
        if(user._id.equals(req.user._id)) value = (value)*(-1);
        for(let U of group.groupMembers){
            if(U.user._id.equals(user._id)){
                U.owe += (value)*(-1);
                break;
            }
        }
        
        for(let G of user.groups){
            if(G.group._id.equals(group._id)){
                G.owe += (value)*(-1);
                break;
            }
        }
        await user.save();

    }

    await group.save();

    res.redirect(`/groups/${group._id}`);
})

app.get("/groups/:id",async (req,res)=>{
    const group = await Group.findById(req.params.id);
    res.render("socket.ejs",{group});
})


app.use((err,req,res,next)=>{
    res.send(err);
})