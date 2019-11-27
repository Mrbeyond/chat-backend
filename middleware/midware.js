'use strict';
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const modellers = require('./../model/modellers');
const ashKey = process.env.keys;


let midMan={
    roleMan: async(req, res, next)=>{
        let { token } = req.headers;
        if (token) {
            try{
                let tokenChecker = jwt.verify(token, ashKey);
                if (tokenChecker){
                    console.log(`this is the token ${tokenChecker.data}`);
                    let user = mongoose.model('user', modellers.users);
                    let confirm = await user.findById(tokenChecker);
                    console.log(` confirm is ${confirm}`);
                    if(confirm.role === 1){
                        next();
                    }else{
                        res.status(401).json('You are unauthorized to perform this operation');
                    }
                }else{
                    res.status(401).json('You cannot perform this operation, please login');
                }
            }catch(err){
                console.log(err);
                res.status(500).json('server error');
            }
        }else{
            res.status(401).json('You cannot perform this operation, please login'); 
        }
    },

    loginMan: async(req, res, next)=>{
        let {token} = req.headers;
        if(token){
            try {
                let tokenChecker = jwt.verify(token, ashKey);
                if (tokenChecker){
                    // console.log(`this is the token ${tokenChecker.data}`);
                    let user = mongoose.model('user', modellers.user);
                    try {   
                        let confirm = await user.findById(tokenChecker.data);
                        if (confirm){
                            next();
                        }else{
                            res.status(403).json('Something went wrong, please login again');
                        }
                    } catch (err) {
                        console.log(err);
                        res.status(500).json('server error');
                    }
                }else{
                    res.status(401).json("Please make sure you logged in");
                }
            } catch (error) {
                let error_mess = (error.message ==='invalid token')? 'Please login first to perform this operation':
                    (error.message ==='jwt expired')? "Sorry your login session has expired please login again":
                   'server';
                console.log(error);
                (error_mess ==='server')?
                res.status(500).json('server error'):
                res.status(403).json(error_mess);
            }
        }else{
            res.status(403).json('Please login first');
        }
    },

    getUser: async (req, res) => {
        return new Promise( async (resolve, reject) => {
            let { token } = req.headers;
            // console.log(token + ' found');
            if (token) {
                try {
                    // console.log('ash key is '+ ashKey);
                    let tokenChecker = jwt.verify(token, ashKey);
                    // console.log( JSON.stringify(tokenChecker) + '  is checker');
                    // console.log('user data is '+ tokenChecker.data);
                    if (tokenChecker){
                        try {                        
                            let user = mongoose.model('user', modellers.user);
                            let get_user = await user.findById(tokenChecker.data);
                            if( get_user) {
                               resolve(get_user);
                            //    next();
                            } else {
                                res.status(500).json('Server error');
                            }
                        } catch (error) {
                            reject(error);
                            console.log(error);
                            res.status(500).json('Server error');
                        }                
                    } else{
                        res.status(401).json('Please login, invalid token');
                    }
                
                } catch (e) {
                    if (e.name = "JsonWebTokenError") {
                        console.log(e.name);
                        res.status(401).json('please login again');
                    } 
                
                }
            } else {
                res.status(401).json('Please login, no token token provided'); 
            }
        });
    },

    returnUser: async (req, res) => {
            let { token } = req.headers;
            // console.log(token + ' found');
            if (token) {
                try {
                    // console.log('ash key is '+ ashKey);
                    let tokenChecker = jwt.verify(token, ashKey);
                    // console.log(JSON.stringify(tokenChecker) + '  is checker');
                    // console.log('user data is '+ tokenChecker.data);
                    if (tokenChecker.data){
                        try {                        
                            let user = mongoose.model('user', modellers.user);
                            let getter = await user.findById(tokenChecker.data);
                            if( getter) {
                                let data = 
                                    {username: getter.username, sex: getter.sex, dp: getter.dp, email: getter.email, _id: getter._id};
                                res.status(200).json(data);
                            }
                        } catch (err) {
                            reject(err);
                            console.log(err);
                          let  error = {value: true, name: err.name, desc: err.message};
                            res.status(500).json(error);
                        }                
                    } else{                        
                        let error = {value: true, name: 'token', desc: 'token error'};
                        res.status(500).json(error);
                    }
                
                } catch (e) {
                    if (e.name = "JsonWebTokenError") {                        
                        let error = {value: true, name: e.name, desc: e.message};
                        res.status(500).json(error);
                    } 
                
                }
            } else {
               let error = {value: true, name: 'server', desc: 'server error'};
                res.status(500).json(error);
            }
    }
};

module.exports=midMan;