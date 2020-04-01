const mongoose = require('mongoose');
const errors = require('../commons/errors.js');
const authorizator = require('../security/authorization.js');
const persistence = require('../commons/persistence.js');

const get = async function(id, field, model) {
    let item = await persistence.get(id, field, model);
    if(!item && model.modelName == 'User') item = await persistence.get(id, 'username', model); 
    if(!item) return null; 
    return item;
}

exports.whatCanRead = async function(req, res) {
    return await authorizator.whatCanRead(req.user);
}

exports.canModify = async function(req, res) {
    const result = await authorizator.canModify(req.resource, req.user);
    if (result != true) return errors.manage(res, errors.restricted_access_modify );
    else return true;
}

exports.canDelete = async function(req, res) {
    const result = await authorizator.canDelete(req.resource, req.user);
    if (result != true) return errors.manage(res, errors.restricted_access_delete );
    else return true;
}

exports.isHim = async function(req, res) {
    const result = await authorizator.isHim(req.resource, req.user);
    if (result != true) return errors.manage(res, errors.not_you);
    else return true;
}

exports.isAdminitrator = async function(req, res) {
    const result = await authorizator.isAdministrator(req.user); 
    if (result != true) return errors.manage(res, errors.admin_restricted_access);
    else return true;
}

exports.isOwner = async function(req, res) {
    const result = await authorizator.isOwner(req.resource, req.user); 
    if (result != true) return errors.manage(res, errors.not_yours);
    else return true;
}

exports.isAvailable = async function(req, res, model) {
    try {
        const item = await get(req.params.id, null, model);
        if(!item) return errors.manage(res, errors.resource_not_found, req.params.id); 
        req.resource = item;
        return true;
    }
    catch (err) { 
        if(err.name == 'CastError') return errors.manage(res, errors.resource_not_found);
        else return errors.manage(res, errors.generic_request_error, err); 
    }
}

exports.isNotUsed = async function(req, res, model, field) {
    let references = [];
    if(model.schema.path(field).instance === 'Array') references = await model.find({ [field] : { $elemMatch : {$in: [req.resource._id]}  } }).limit(1);
    else references = await model.find({ [field]: req.resource._id }).limit(1);
    if (references.length != 0) return errors.manage(res, errors.already_used, 'Used in ' + references._id + ' ' + model.modelName);
    return true;
} 

exports.isFilled = async function(req, res, values ) {
    if(!values.some(function (element) { return req.body[element] !== null; }) ) return errors.manage(res, errors.missing_info);
    else return true;
}

