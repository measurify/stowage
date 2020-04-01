require('../models/userSchema');

const UserRoles = require('../types/userRoles');
const crypto = require("crypto");
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Element = mongoose.model('Element');
const Tag = mongoose.model('Tag');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.uuid = function() { return crypto.randomBytes(16).toString("hex"); }

exports.random = function(max) { return Math.floor(Math.random() * max); }

exports.createSuperAdministrator = async function() { 
    return await this.createUser(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD, UserRoles.admin);
};

exports.dropContents = async function(){  
    try{  
        await mongoose.connection.dropDatabase(); 
        await this.createSuperAdministrator();
    }
    catch (error) {await this.createSuperAdministrator();} 
}

exports.getAdminToken = async function() {
    const admin = await User.findOne({ username: process.env.ADMIN_USERNAME });
    const token = jwt.sign(admin.toJSON(), process.env.JWTSECRET);
    return 'JWT ' + token;
};

exports.getUserToken = async function(user) {
    const token = jwt.sign(user.toJSON(), process.env.JWTSECRET);
    return 'JWT ' + token;
};

exports.createDemoContent = async function() {
    const users = [];
    users.push(await this.createUser('user-name-1', 'password-1', UserRoles.normal));
    users.push(await this.createUser('user-name-2', 'password-2', UserRoles.normal));

    const tags = [];
    tags.push(await this.createTag('tag_1', users[0]));
    tags.push(await this.createTag('tag_2', users[0]));
    tags.push(await this.createTag('tag_3', users[0]));
    tags.push(await this.createTag('tag_4', users[0]));
    
    const elements = [];
    elements.push(await this.createElement("element_1", users[0], JSON.stringify({value: 'content_1'}), [tags[0]]));
    elements.push(await this.createElement("element_2", users[0], JSON.stringify({value: 'content_2'}), [tags[0], tags[1]]));
    elements.push(await this.createElement("element_3", users[0], JSON.stringify({value: 'content_3'}), [tags[2]]));
    elements.push(await this.createElement("element_4", users[1], JSON.stringify({value: 'content_4'}), [tags[1]]));
}

exports.createUser = async function(username, password, type) {
    let user = await User.findOne( { username: username });
    if(!user) {
        const req = { 
            username: username || uuid(),
            password: password ||  uuid(),
            type: type || UserRoles.normal };
        user = new User(req);
        await user.save();
    }
    return await User.findById(user._id);
};

exports.createTag = async function(name, owner, tags) {
    let tag = await Tag.findOne( { _id: name });
    if(!tag) {
        const req = { _id: name , owner: owner, tags: tags }
        tag = new Tag(req);
        await tag.save();
    }
    return tag._doc;
};

exports.createElement = async function(name, owner, content, tags) {
    const req = { 
        _id: name,
        owner: owner,
        content: content || ({ value: 'value' }).toString(),
        tags: tags
    }
    const element = new Element(req);
    await element.save();
    return element._doc;
};
