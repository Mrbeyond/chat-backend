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

const Socket = {
    
}