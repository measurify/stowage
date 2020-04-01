const mongoose = require('mongoose');
const controller = require('./controller');
const checker = require('./checker');
const Tag = mongoose.model('Tag');
const Element = mongoose.model('Element');
const errors = require('../commons/errors.js');

exports.get = async (req, res) => { 
    return await controller.getResourceList(req, res, '{ "timestamp": "desc" }', '{}', Tag);
};

exports.getone = async (req, res) => { 
    let result = await checker.isAvailable(req, res, Tag); if (result != true) return result;
    return res.status(200).json(req.resource);
};

exports.post = async (req, res) => {
    return await controller.postResource(req, res, Tag);
};

exports.put = async (req, res) => { 
    const fields = ['tags'];
    let result = await checker.isAvailable(req, res, Tag); if (result != true) return result;
    result = await checker.isFilled(req, res, fields); if (result != true) return result;
    result = await checker.canModify(req, res); if (result != true) return result;
    return await controller.updateResource(req, res, fields, Tag);
};

exports.delete = async (req, res) => {
    let result = await checker.isAvailable(req, res, Tag); if (result != true) return result;
    result = await checker.canDelete(req, res); if (result != true) return result;
    result = await checker.isNotUsed(req, res, Element, 'tags'); if (result != true) return result;
    result = await checker.isNotUsed(req, res, Tag, 'tags'); if (result != true) return result;
    return await controller.deleteResource(req, res, Tag);
};

