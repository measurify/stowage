
const UserRoles = require('../types/userRoles.js');
const persistence = require('../commons/persistence.js');

exports.isAdministrator = function(user) {
    if (user.type == UserRoles.admin) return true;
    else return false;
}

exports.isOwner = function(resource, user) {
    return resource.owner._id.equals(user._id); 
}

exports.isHim = function(resource, user) {
    if (this.isAdministrator(user)) return true;
    return resource._id.equals(user._id); 
}

exports.canModify = function(resource, user) {
    if (this.isAdministrator(user)) return true;
    if (this.isOwner(resource, user)) return true;
    return false
} 

exports.canDelete = function(resource, user) {
    if (this.isAdministrator(user)) return true;
    if (this.isOwner(resource, user)) return true;
    return false;
}  

exports.whatCanRead = function(user) {
    if (this.isAdministrator(user)) return result;
    return { owner: user._id };
} 
