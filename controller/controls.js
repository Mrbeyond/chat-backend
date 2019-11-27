'use strict';
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const formidable = require('formidable');
const path = require('path');

const modellers = require('./../model/modellers');
const midMan = require('./../middleware/midware');
const ashKey = process.env.keys;
const pathWay = process.env.files;
const chatFilePath = process.env.chatFiles;

mongoose.connect('mongodb+srv://beyond:lovebeyond007@cluster0-fjpbb.mongodb.net/chatapp?retryWrites=true&w=majority',
 {useNewUrlParser:true, useUnifiedTopology: true, useFindAndModify:false, useCreateIndex: true});
// mongoose.set('useCreateIndex', true);
const structure ={
    error:null,
    data: null
};

let controlMan={
    signup: async(req, res)=>{
        console.log(req.body);
        let{ username, email, password, sex } = req.body;
        try {
            console.log('password is ' + password);
            let crypt = await bcrypt.hash(password, 10);
            console.log(crypt);
            let user = mongoose.model('user', modellers.user);
            let users = new user({
                role:0,
                username: username,                
                email: email,
                password: crypt,
                sex: sex,
                dp: null,
                date: Date.now()
            });
            try {
                console.log('before result');
                let result = await users.save();
                console.log('after result');
                    let { _id } = result;
                    let tokenGen = jwt.sign({data:_id}, ashKey /*,{expiresIn: '2h'}*/);
                    console.log( tokenGen);
                    let data =
                     {username:result.username, token: tokenGen, sex: result.sex, email: result.email, dp: result.dp, id: result._id};
                    res.status(200).json(data);                          
               } catch (err) {
                controlMan._errorSample(err, res);
               }
        }catch (err) {
            console.log(err);
            res.status(500).json('server error');
        }
    },

    login:async(req, res) => {
        let { password, email } = req.body;
        console.log(req.body);
        try {
            console.log(email)
            let user = mongoose.model('user', modellers.user);
            let confirm = await user.findOne({ email: email });
            console.log('after model');
            console.log(confirm);
            if(confirm){
                try {
                    let crypt = await bcrypt.compare(password, confirm.password);
                    if (crypt) {
                            let { _id } = confirm;
                            let tokenGen =  jwt.sign({data:_id}, ashKey /*,{expiresIn: '2h'}*/);
                            console.log( tokenGen);
                            let data=
                            {username: confirm.username, token: tokenGen, sex: confirm.sex, email: confirm.email, dp: confirm.dp, _id: confirm._id};
                                res.status(200).json(data);
                        }else{
                            res.json({code: 401, message: 'false encryption of password, password is incorrect'});
                        }                    
                } catch (error) {
                    console.log(error);
                    res.json({code: 401, message: error.message});
                }
            }else{
                res.json({code: 204, message: "user does not exists"});
            }
        } catch (error) {
            console.log(error);
            res.json({code: 500, message: 'server error'});
        }
    },

    upload: async (req, res) => {
        // console.log('hit');
        let ID = await midMan.getUser(req, res)
        let dater = Date.now();
        if (ID) {
            // console.log(`_id is ${ID._id} and id is ${ID.id}`);
            let media = new formidable.IncomingForm();
            media.parse(req);
            media.on('fileBegin', (name, file) => {        
                console.log('begin ' + name );            
                let num =  (file.type).indexOf('/');
                let Dir =  (file.type).slice(0, num);
                let namer =   `${ID._id}_${dater}${path.extname(file.name)}`
                file.path =  ( pathWay+'/'+Dir+'/'+namer); 
            });
            media.on('file', async (name, file) => {
                let user = mongoose.model('user', modellers.user);
                try {
                    let process = await user.findByIdAndUpdate(
                        ID._id, {dp: `${ID._id}_${dater}${path.extname(file.name)}`}, {new:true, upsert:true}
                    );
                    if (process) {                        
                        console.log(process);
                        console.log(` started and path is ${file.path} and type is ${file.type} and ${file.size}`);
                        let data = {name: process.dp, desc: 'upload was successful'}
                        res.status(200).json(data);
                    }
                } catch (e) {
                    console.log(e);
                    let error = {value: true, name: e.name, desc: e.message};
                    res.status(500).json(error);
                }
                
            });            
        } 
    },

    fileProcessor: async (data, senderId, folder) =>{
        return new Promise((resolve, reject) => {
            if(! senderId) reject(0);
            let media = new formidable.IncomingForm();
            media.parse(data);
            media.on('fileBegin', (name, file) => {        
                console.log('begin ' + name );            
                let num =  (file.type).indexOf('/');
                let Dir =  (file.type).slice(0, num);
                let dater = Date.now();
                let namer =   `${senderId}_${dater}${path.extname(file.name)}`
                file.path =  (chatFilePath+'/'+folder+'/'+Dir+'/'+namer); 
            });
            media.on('error', (err) => {
                reject(0);
            });
            media.on('file', async (name, file) => {
                // console.log('done from file processor');
                resolve(`${senderId}_${dater}${path.extname(file.name)}`);
            });  
        });
    },

    createRoom: async (req, res) => {
        let  { type, name } = req.body;
        try {
            let ID = await midMan.getUser(req, res)
            if (ID){

                let room = mongoose.model('room', modellers.Rooms);
                try{
                    let checker = await room.findOne({type: type, name: name});
                    if (!checker){                    
                        let rooms = new room({
                            type: type,
                            creator: ID._id,
                            name: name,
                            date: Date.now()
                        });
                        try {
                            let process = await rooms.save();
                            if(process._id){
                                console.log('------------------------------------');
                                console.log(process);
                                console.log('------------------------------------');
                                let  member = mongoose.model('roomMember', modellers.RoomMembers);
                                try {
                                    let tester = await member.findOne({roomId: process._id, userId: process.creator});
                                    if(!tester){
                                        let members = new member({
                                            roomId: process._id,
                                            userId: process.creator,
                                            role: 1,
                                            logo: '',
                                            creator: process.creator,
                                            date: Date.now(),
                                        });
                                        try {
                                            let product = await members.save();
                                            if (product) {
                                                let data={type: process.type, _id: process._id, name: process.name, date: process.date}
                                                res.status(200).json(data);
                                            }
                                        } catch (err) {
                                            controlMan._errorSample(err, res);
                                        }
                                    }                    
                                } catch (err) {
                                    controlMan._errorSample(err, res);                    
                                }
                            }            
                        } catch (err) {
                            controlMan._errorSample(err, res);
                        }
                    }else{
                        res.json({error: true, name: 'duplicate name', message: 'group already exists'});
                    }
                } catch (err) {
                    controlMan._errorSample(err, res);
                }
            }
        } catch (err) {
            controlMan._errorSample(err, res);
        }
    },

    getRooms: async (req, res) => {
        let room = mongoose.model('room', modellers.Rooms);
        try {
            let rooms = await room.find().lean().select(['id', 'name', 'creator', 'logo', 'type', 'date']);
            if(rooms.length > 0) {
                res.status(200).json(rooms);
            }else{  
                let error={value: true, name: 'not found', desc: 'No room is available'};             
                res.status(401).json(error); 
            }        
        } catch (e) {
            console.log(e);
            let error={value: true, name: e.name, desc: 'server error'};
            res.status(500).json(error);        
        }
    },

    leaveRoom: async (req, res) => {
        let { roomId } = req.params;
        if (roomId) {
            try {
                let ID = await midMan.getUser(req, res);
                if(ID) {
                    let  member = mongoose.model('roomMember', modellers.RoomMembers);
                    try {
                        let tester = await member.findOneAndDelete({roomId: roomId, userId: ID._id});
                        if (tester) {
                            let allMembers = await controlMan._getAllMembers(tester.roomId);
                            if(allMembers !== 0 && allMembers !== 1) {
                                res.status(200).json(allMembers);
                            }
                        }
                    } catch(err) {
                        controlMan._errorSample(err, res);
                    }
                }
            } catch (err) {
                controlMan._errorSample(err, res);
            }
        }  else {
            let error={value: true, name: 'bad request', desc:'room id is not provided'};
            res.status(401).json(error)
        }
    },

    joinRoom: async (req, res) => {
        let { roomId } = req.params;
        if(roomId) {
            try {
                let ID = await midMan.getUser(req, res);
                if(ID) {
                    let  member = mongoose.model('roomMember', modellers.RoomMembers);
                    try {
                        let tester = await member.findOne({roomId: roomId, userId: ID._id});
                        if(!tester){
                            let members = new member({
                                roomId: roomId,
                                userId: ID._id,
                                role: 0,
                                date: Date.now()
                            });
                            try {
                                let process = await members.save();
                                if (process) {
                                    let allMembers = await controlMan._getAllMembers(process.roomId);
                                    if(allMembers !== 0 && allMembers !== 1) {
                                        res.status(200).json(allMembers);
                                    }
                                }
                            } catch (err) {
                                controlMan._errorSample(err, res);
                            }
                        } else {
                            res.status(401).json('already a member of this group');
                        }            
                    } catch (err) {
                        controlMan._errorSample(err, res);
                    }
                }
            } catch (e) {
               controlMan._errorSample(e, res);
            }                    
        } else {
            let error={value: true, name: 'bad request', desc:'room id is not provided'};
            res.status(401).json(error)
        }
    },

    _errorSample: (err, res) =>{
        console.log(err);
        let error={value: true, name: err.name, desc: err.message };
        res.json(error);
    },
    
    _getAllMembers: async (roomId) => {
        return new Promise( async (resolve, reject) =>{
            let member = mongoose.model('roomMember', modellers.RoomMembers);
            try {
                let members = await member.find({roomId: roomId}).lean()
                .populate('userId', ['username', 'dp', 'sex'], mongoose.model('user', modellers.user))
                .select(['role', 'userId', 'username', 'dp', 'sex']);
                if(members.length > 0) {
                    resolve(members);
                } else{
                    reject(0)
                }
            } catch(e) {
                console.log(e);
                reject(1)
            }
        });
    },
    
    getMembers: async (req, res) => {
        let { roomId } = req.params;
        if(roomId){
            try {
                let allMembers = await controlMan._getAllMembers(roomId);
                if(allMembers !== 0 && allMembers !== 1) {
                    res.status(200).json(allMembers);
                }else{  
                    let error={code: 401, name: 'not found', desc: 'No Member is available'};             
                    res.json(error); 
                }
            } catch (e) {                
                let error={code: 500, name: e.name, desc:'server error'};
                res.json(error)
            }

        }else{
            let error={code: 401, name: 'bad request', desc:'room id is not provided'};
            res.json(error);
        }
    },

    saveRoomChat: async (data, folder) =>{
        return new Promise( async (resolve, reject) =>{
            if (data) {
                let message = null;
                if( data.type !== 2 && data.type !==4){
                  let  collector = await controlMan.fileProcessor(data.message, data.senderId, folder);
                  if(collector !== 0 && typeof(collector) !== 'number') {
                      message = collector;
                  }else{
                      reject(0);
                  }
                }else{
                   message = data.message; 
                } 
                let model = mongoose.model('roomChat', modellers.roomChats);
                let models = new model({
                    senderId: data.senderId,
                    roomId: data.roomId,
                    message: message,
                    type: data.type,
                    date: Date.now(),
                })
                try {
                    let process = await models.save();
                    if (process) {
                        resolve(process);                        
                    }                
                } catch (e) {
                    console.log(e)
                    reject(1);
                }
            }
        })

    },

    getRoomMessages: async (req, res) => {
        let { roomId } = req.params;
        if (roomId){
            let message = mongoose.model('roomChat', modellers.roomChats);
            try {
                let response = await message.find({roomId: roomId}).lean().select(['roomId', 'senderId', "message", '_id', 'type', 'date' ]);
                if  (response.length > 0){
                    res.status(200).json(response);
                }else{
                    let error={code: 204, name: 'bad request', desc:'no message found'};
                    res.json(error);
                }
            } catch (e) {
                let error={code: 401, name: e.name, desc: e.message};
                    res.json(error);
            }
        }else{
            let error={code: 401, name: 'bad request', desc:'room id is not provided'};
            res.json(error);
        }

    }, 

    friendRequest: async (req, res) => {
        let { acceptor } = req.params;
        if (acceptor) {
            try {
             let ID = await midMan.getUser(req, res);
             if (ID !== 0 && ID !==1) {
                 let request = mongoose.model('relationship', modellers.relationship);
                 let operation = new request({
                     initiator: ID._id,
                     acceptor: acceptor,
                     status: 0,
                     date: Date.now(),
                    });
                try {
                    let confirm = await operation.save();
                    if (confirm){
                        let data= {init: confirm.initiator, status: confirm.status, accept: confirm.acceptor, date: confirm.date}
                        res.status(200).json(data)
                    }                 
                 } catch (err) {
                    controlMan._errorSample(err, res);
                 }
             }
            } catch (err) {
            controlMan._errorSample(err, res);
            }

        } else {
            res.json({code: 401, message: 'Bad request, no friend provided'});
        }
    },

    acceptFriendRequest: async (req, res) =>{
        let { initiator } = request.params;
        if (initiator){
            let ID = await midMan.getUser(req, res);
            if(ID !== 0 && ID !== 1){
                let relationship = mongoose.model('relationship', modellers.relationship);
                try {
                    let process = await relationship.findOneAndUpdate({initiator: initiator, acceptor: ID._id}, {status: 1}, {new: true, upsert: true});
                    if (process) {
                        res.status(200).json({code: 200, message: 'successfully updated'});
                    }
                } catch (err) {
                 controlMan._errorSample(err, res);
                }
            }

        } else{
            let error={value: 401, name: 'bad request', desc:'initiator id is not provided'};
            res.json(error);
        }

    },
    savePCMessages: async (data, folder) => {
        return new Promise( async (resolve, reject) =>{
            if (data) {
                let message = null;
                if( data.type !== 2 && data.type !==4){
                  let  collector = await controlMan.fileProcessor(data.message, data.senderId, folder);
                  if(collector !== 0 && typeof(collector) !== 'number') {
                      message = collector;
                  }else{
                      reject(0);
                  }
                }else{
                   message = data.message; 
                } 
                let model = mongoose.model('privateChat', modellers.privateChats);
                let models = new model({
                    fromId: data.fromId,
                    toId: data.toId,
                    pcId: data.pcId,
                    message: message,
                    type: data.type,
                    date: data.date,
                })
                try {
                    let process = await models.save();
                    if (process) {
                        resolve(process);                        
                    }                
                } catch (e) {
                    console.log(e)
                    reject(1);
                }
            }
        })
    },

    getPCMessages: async (req, res) => {
        let {pcId} = req.params;
        if (pcId) {
            let model = mongoose.model('privateChat', modellers.privateChats);
            try {
            let process = await model.find({pcId: pcId}).select(['pcId', 'fromId', "message", '_id', 'type', 'date', 'toId' ]);
            if (process.length > 0) {
                res.status(200).json(process);
            } else {
                res.json({code: 204, desc: 'no message found'});
            }
            } catch (err) {
            controlMan._errorSample(err, res);
            }

        } else {
            let error={code: 401, name: 'bad request', desc:'pcId is not provided'};
            res.json(error); 
        }
    },

    followers: async (req, res) => {
        let { acceptorId} = req.params;
        if (acceptorId) {
            let model = mongoose.model('relationship', modellers.relationship);
            try {
                let process = await model.find({acceptor: acceptorId, status: 1}).lean()
                .populate('initiator', ['username', '_id', 'email', 'dp', 'sex'], mongoose.model('user', modellers.user))
                .select(['email', 'initiator', 'userId', 'username', 'dp', 'sex']);
                if (process.length > 0) {
                    console.log(process);
                    res.status(200).json(process)
                } else {
                    let error={code: 201, name: 'bad request', desc:'no followers'};
                    res.json(error)
                }
            } catch (err) {
                controlMan._errorSample(err, res);
            }

        } else {
            let error={code: 401, name: 'bad request', desc:'acceptorId is not provided'};
            res.json(error)
        }
    },

    following: async(req, res) => {
        let { initiatorId} = req.params;
        if (initiatorId) {
            let model = mongoose.model('relationship', modellers.relationship);
            try {
                let process = await model.find({initiator: initiatorId, status: 1}).lean()
                .populate('acceptor', ['username', '_id', 'email', 'dp', 'sex'], mongoose.model('user', modellers.user))
                .select(['email', 'initiator', 'userId', 'username', 'dp', 'sex']);
                if (process.length > 0) {
                    console.log(process);
                    res.status(200).json(process)
                } else {
                    let error={code: 201, name: 'bad request', desc:'no followers'};
                    res.json(error)
                }
            } catch (err) {
                controlMan._errorSample(err, res);
            }
        } else {
            let error={code: 401, name: 'bad request', desc:'initiatorId is not provided'};
            res.json(error)
        }
    },


}


module.exports=controlMan;
