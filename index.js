" use strict ";
require('dotenv').config();
const express = require('express');
const formidable = require('formidable');
const path = require('path');
const bodyParser = require('body-parser');
const jwt= require('jsonwebtoken');
const cors = require('cors');

const controlMan = require('./controller/controls');
const midMan = require('./middleware/midware');

const PORT = process.env.PORT || 2050;
const key = process.env.keys;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cors());


app.use('/w3css', express.static(__dirname+"/public/w3css"));
app.use('/audio', express.static(__dirname+"/public/uploads/audio"));
app.use('/image', express.static(__dirname+'/public/uploads/image'));
app.use('/video', express.static(__dirname+"/public/uploads/video"));

const server = app.listen((PORT), ( err )=>{
    if(err) console.log(err);
    console.log( `My relate is serving on port ${PORT}, let us keep chatting ${key}`);
}); 

app.get('/home', ( req, res ) => {
    console.log(__dirname)
    res.status(200).json({body: 'tested'});
});

app.get('/img', controlMan.QQ);
app.get('/returnUser', midMan.returnUser);
app.post('/upload', controlMan.upload);
app.post('/signup', controlMan.signup);
app.post('/login', controlMan.login);
app.post('/createRoom', controlMan.createRoom);
app.get('/getRooms', midMan.loginMan, controlMan.getRooms);
app.get('/getMembers/:roomId', midMan.loginMan, controlMan.getMembers);
app.get('/getRoomMessages/:roomId', midMan.loginMan, controlMan.getRoomMessages);
app.get('/leaveRoom/:roomId', midMan.loginMan, controlMan.leaveRoom);
app.get('/joinRoom/:roomId', midMan.loginMan, controlMan.joinRoom);
app.get('/getPcMessages/:pcId', midMan.loginMan, controlMan.getPCMessages);
app.get('/followers/:acceptorId', midMan.loginMan, controlMan.followers);
app.get('/following/:initiatorId', midMan.loginMan, controlMan.following);
app.get('friendRequest/:acceptor', midMan.loginMan, controlMan.friendRequest);
app.get('acceptFriendRequest/:initiator', midMan.loginMan, controlMan.acceptFriendRequest);

app.get('/tester', async(req, res) => {
    let user = await midMan.getUser( req, res);
    if ( user) res.json(user);
})

let io = require('socket.io')(server);
io.on('connection', ( socket )=>{
    socket.on('conn', ( data )=>{
            console.log(`${data} has joined`);
    });

    socket.on('message', async ( data )=>{
        console.log(data);
        if (data.message) {
            socket.join(data.roomId);
            let response = await controlMan.saveRoomChat(data, 'roomFiles');
            console.log('response is '+ response);
            if(response !== 0 && response !== 1){
            // socket.to(data.room).emit('mess', data); // for broadcast
            io.in(data.roomId).emit('message', data);
            }
        }
        // io.emit('mess', data);
    });

    socket.on('join', async (data) => {
        console.log(data);
        if (data.message && data.roomId && data.senderId){
            socket.join(data.roomId);
            let response = await controlMan.saveRoomChat(data, 'roomFiles');
            console.log('response is '+ JSON.stringify(response));
            if(response !== 0 && response !== 1){
                socket.to(data.roomId).emit('join', response);
            }
        }
    });

    socket.on('leave', async (data) => {
        console.log(data);
        if (data.message && data.roomId && data.senderId){
            socket.leave(data.roomId);
            let response = await controlMan.leaveRoom(data);
            console.log('response is '+ JSON.stringify(response));
            if(response !== 0 && response !== 1){
                socket.to(data.roomId).emit('leave', response);
            }
        }
    });

    socket.on('pc', async(data) => {
        console.log(data);
        if (data.message) {
            socket.join(data.pcId);
            let response = await controlMan.savePCMessages(data, 'pcFiles');
            console.log('response is '+ response);
            if(response !== 0 && response !== 1){
                io.to(data.pcId).emit('pc', response)
            // socket.to(data.room).emit('mess', data); // for broadcast
            }
        }
    });


});
