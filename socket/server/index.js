console.log("server.js");

const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const {createServer} = require("http");
const cors = require("cors");
const PORT = 3000;

const User = require("../../models/user");
const Group = require("../../models/groups");

const dbUrl = 'mongodb://127.0.0.1:27017/OweMe' 

mongoose.connect(dbUrl)
  .then(()=>{
    console.log("connected");
  })
  .catch((err)=>{
    console.log("there is an error in connecting");
    console.log(err);
  })



const app = express();
const server = createServer(app);
const io  = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"],
        credentials: true
    }
});

app.use(cors({
    origin:"*",
    methods:["GET","POST"],
    credentials: true
}));

app.get("/",(req,res)=>{
    res.send("hello");
});

io.on("connection" , (socket)=>{

    console.log("user connected",socket.id);

    socket.on("joinRoom",(room)=>{
        console.log(`${socket.id} joined ${room}`);
        socket.join(room);
    })

    socket.on("message",(data)=>{
        io.to(data.room).emit("receiveMessage",data.data);
        // const group = await Group.findById(data.room);
    })

    // console.log("ID",socket.id);
    
    // socket.broadcast.emit("welcome",`hello brother${socket.id}`);
    socket.on("disconnect",()=>{
        console.log(`${socket.id} disconnected` );
    })
})


server.listen( PORT , ()=>{
    console.log(`started listning to the port ${PORT}`);
} );