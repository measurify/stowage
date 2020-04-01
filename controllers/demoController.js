const mongoose = require('mongoose');
const factory = require('../commons/factory.js');
const User = mongoose.model('User');
const Tag = mongoose.model('Tag');
const Element = mongoose.model('Element');
const Authorization = require('../security/authorization.js');
const errors = require('../commons/errors.js');

exports.get = async (req, res) => {
    if (!Authorization.isAdministrator(req.user)) return errors.manage(res, errors.admin_restricted_access); 
    const users = await User.find({}).select("+password");
    const tags = await Tag.find({});
    const elements = await Element.find({});
    res.status(200).json({ users: users, tags: tags, elements:elements });
};

exports.post = async (req, res) => {
    if (!Authorization.isAdministrator(req.user)) return errors.manage(res, errors.admin_restricted_access); 
    await factory.dropContents();;
    if (req.body != '{}') await factory.createDemoContent(); 
    else return errors.manage(res, errors.demo_content_request_not_implemented);
    const users = await User.find({}).select("+password");
    const tags = await Tag.find({});
    const elements = await Element.find({});
    res.status(200).json({ users: users, tags: tags, elements:elements });
};

exports.delete = async (req, res) => {
    if (!Authorization.isAdministrator(req.user)) return errors.manage(res, errors.admin_restricted_access); 
    await factory.dropContents();;
    const users = await User.find({}).select("+password");
    const tags = await Tag.find({});
    const elements = await Element.find({});
    res.status(200).json({ users: users, tags: tags, elements:elements });
};
