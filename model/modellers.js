const mongoose = require('mongoose');
const objectId = mongoose.Schema.Types.ObjectId;

let modMan = {
    user: new mongoose.Schema({
        username: {type: String, required: true, trim: true, unique:true, minlength: 3},
        email: {type:String, required: true, unique:true, trim:true,
            validate:{
              validator:(value ) => {return (/^([a-zA-Z0-9_-]*)(\@)([a-zA-Z0-9_-]+)(\.)([a-zA-Z_-]+)$/).test(value);},
              message: 'Please use a valid email'
           }},
        sex: {type:String, required: true, trim: true,
            validate: {
                validator:( gender ) => { return (/^(male)|(female)$/).test(gender);},
                message: 'Critical error, an attack to form data from front end is suspected in user registration'
            }
        },
        password: {type:String, required: true, trim:true, minlength: 7},
        dp: { type: String, trim: true},
        date: { type: Date,  required: true }
    }),

    Rooms: new mongoose.Schema({
        name: {type: String, required: true, trim: true},
        logo: {type: String, trim: true},
        creator: {type: objectId, required: true},
        date: {type: Date, required: true},
        type: {type : Number, required: true, trim: true, maxlength: 1, minlength: 1,        
            validate: {
                validator:( value ) => { return (/^(0)|(1)$/).test(value);},
                message: 'Critical error, an attack to form data from front end is suspected in Room creation'
            }}
    }),

    RoomMembers: new mongoose.Schema({
        roomId: {type: objectId, required: true, trim: true},
        userId: {type: objectId, required: true},
        role: {type: Number, required: true, trim: true, maxlength: 1, minlength: 1,
            validate: {
                validator:( value ) => { return (/^(0)|(1)$/).test(value);},
                message: 'Critical error, an attack to form data from front end is suspected in roomMembers'
            }
        },
        date: {type: Date, required: true},
    }),

    privateChats: new mongoose.Schema({
        fromId: {type: objectId, required: true, trim: true},
        toId: {type: objectId, required: true},
        pcId: {type: String, required: true, trim: true},
        message: {type: String, required: true, trim: true},
        type: {type: Number, required: true, trim: true, maxlength: 1, minlength: 1,
            validate: {
                validator:( value ) => { return (/^(0)|(1)|(2)|(3)|(4)$/).test(value);},
                message: 'Critical error, an attack to message data from front end is suspected in roomChat'
            }
        },
        date: {type: Date, required: true},
    }),

    roomChats: new mongoose.Schema({
        senderId: {type: objectId, required: true, trim: true},
        roomId: {type: objectId, required: true},
        message: {type: String, required: true, trim: true},
        type: {type: Number, required: true, trim: true, maxlength: 1, minlength: 1,
            validate: {
                validator:( value ) => { return (/^(0)|(1)|(2)|(3)|(4)$/).test(value);},
                message: 'Critical error, an attack to message data from front end is suspected in roomChat'
            }
        },
        date: {type: Date, required: true},
    }),
    
    relationship: new mongoose.Schema({
        initiator: {type: objectId, required: true, trim: true},
        acceptor:{type: objectId, required: true, trim: true},
        status: {type: Number, required: true, trim: true, maxlength: 1, minlength: 1,
            validate: {
                validator:( value ) => { return (/^(0)|(1)$/).test(value);},
                message: 'Critical error, an attack to form data from front end is suspected in relationship creation'
            }
        },
        date: {type: Date, required: true},
    }),

    

};

module.exports = modMan;