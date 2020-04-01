// Import environmental variables from variables.test.env file
require('dotenv').config({ path: 'variables.test.env' });

// This line allow to test with the self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Import test tools
const chai = require('chai');
const chaiHttp = require('chai-http');
const database = require('../database.js');
const server = require('../server.js');
const mongoose = require('mongoose');
const should = chai.should();
const factory = require('../commons/factory.js');
const User = mongoose.model('User');
const UserRoles = require('../types/userRoles.js');
const errors = require('../commons/errors.js');

chai.use(chaiHttp);

// Test the /GET route
describe('/GET users', () => {
    it('it should GET all the users', async () => {
        await factory.dropContents();
        await factory.createUser("test-username-1", "test-password-1");
        await factory.createUser("test-username-2", "test-password-2");
        const res = await chai.request(server).get('/v1/users').set('Authorization', await factory.getAdminToken());
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(3);
    });

    it('it should GET all the usernames', async () => {
        await factory.dropContents();;
        const user = await factory.createUser("test-username-0", "test-password-0", UserRoles.normal);
        await factory.createUser("test-username-1", "test-password-1");
        await factory.createUser("test-username-2", "test-password-2");
        const res = await chai.request(server).get('/v1/usernames').set('Authorization', await factory.getUserToken(user));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(4);
    });

    it('it should not GET all the users as a regular user', async () => {
        await factory.dropContents();;
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        await factory.createUser("test-username-1", "test-password-1");
        await factory.createUser("test-username-2", "test-password-2");
        const res = await chai.request(server).get('/v1/users').set('Authorization', await factory.getUserToken(user));
        res.should.have.status(errors.admin_restricted_access.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.be.eql(errors.admin_restricted_access.message);
    });

    it('it should GET a specific user', async () => {
        await factory.dropContents();;
        const user = await factory.createUser("test-username-1", "test-password-1");
        const res = await chai.request(server).get('/v1/users/' + user._id).set('Authorization', await factory.getAdminToken());
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body._id.should.eql(user._id.toString());
    });

    it('it should not GET a specific user as a regular user', async () => {
        await factory.dropContents();;
        const regular = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const user = await factory.createUser("test-username-2", "test-password-2");
        const res = await chai.request(server).get('/v1/users/' + user._id).set('Authorization', await factory.getUserToken(regular));
        res.should.have.status(errors.not_you.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.be.eql(errors.not_you.message);
    });

    it('it should not GET a fake user', async () => {
        const res = await chai.request(server).get('/v1/users/fake-user').set('Authorization', await factory.getAdminToken());
        res.should.have.status(errors.resource_not_found.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.be.eql(errors.resource_not_found.message);
    });
}); 

// Test the /POST route
describe('/POST users', () => {
    it('it should not POST a user without username field', async () => {
        await factory.dropContents();;
        const user = { password : "test-password-1", usertype : "normal" };
        const res = await chai.request(server).post('/v1/users').set("Authorization", await factory.getAdminToken()).send(user);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.should.have.status(errors.post_request_error.status);
        res.body.message.should.contain(errors.post_request_error.message);
        res.body.details.should.contain("Path `username` is required");
    });

    it('it should not POST a user without password field', async () => {
        await factory.dropContents();;
        const user = { username: "test-username-1", usertype : "normal" };
        const res = await chai.request(server).post('/v1/users').set('Authorization', await factory.getAdminToken()).send(user);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.should.have.status(errors.post_request_error.status);
        res.body.message.should.contain(errors.post_request_error.message);
        res.body.details.should.contain("Path `password` is required");
    });

    it('it should not POST a user without type field', async () => {
        await factory.dropContents();;
        const user = { username: "test-username-1", password : "test-password-1" };
        const res = await chai.request(server).post('/v1/users').set('Authorization', await factory.getAdminToken()).send(user);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.should.have.status(errors.post_request_error.status);
        res.body.message.should.contain(errors.post_request_error.message);
        res.body.details.should.contain("Path `type` is required");
    });

    it('it should not POST a user with a fake type', async () => {
        await factory.dropContents();;
        const user = { username: "test-username-1", password : "test-password-1", type: "fake-type" };
        const res = await chai.request(server).post('/v1/users').set('Authorization', await factory.getAdminToken()).send(user);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.should.have.status(errors.post_request_error.status);
        res.body.message.should.contain(errors.post_request_error.message);
        res.body.details.should.contain("unrecognized type");
    });

    it('it should POST a user', async () => {
        await factory.dropContents();;
        const user = { username : "test-username-1", password : "test-password-1", type: UserRoles.normal };
        const res = await chai.request(server).post('/v1/users').set('Authorization', await factory.getAdminToken()).send(user);
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('_id');
        res.body.should.have.property('username');
        res.body.should.have.property('type');
        res.body.username.should.be.eql(user.username);
    });

    it('it should not POST a user with already existant username field', async () => {
        await factory.dropContents();;
        await factory.createUser("test-username-1", "test-password-1");
        const user = { username : "test-username-1", password : "test-password-1", type : UserRoles.normal};
        const res = await chai.request(server).post('/v1/users').set('Authorization', await factory.getAdminToken()).send(user);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.should.have.status(errors.post_request_error.status);
        res.body.message.should.contain(errors.post_request_error.message);
        res.body.details.should.contain("a user with the same username already exists");
    });

    it('it should POST a list of users', async () => {
        await factory.dropContents();;
        const users = [ { username : "test-username-1", password : "test-password-1", type: UserRoles.normal }, 
                        { username : "test-username-2", password : "test-password-2", type: UserRoles.normal } ]; 
        const res = await chai.request(server).post('/v1/users').set('Authorization', await factory.getAdminToken()).send(users)
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.users[0].username.should.be.eql(users[0].username);
        res.body.users[1].username.should.be.eql(users[1].username);
    });

    it('it should POST only not existing users from a list', async () => {
        await factory.dropContents();;
        await factory.createUser("test-username-1", "test-password-1");
        await factory.createUser("test-username-2", "test-password-2");
        const users = [ { username : "test-username-1", password : "test-password-1", type: UserRoles.normal },
                        { username : "test-username-1", password : "test-password-2", type: UserRoles.normal },
                        { username : "test-username-3", password : "test-password-3", type: UserRoles.normal },
                        { username : "test-username-4", password : "test-password-4", type: UserRoles.normal },
                        { username : "test-username-5", password : "test-password-5", type: UserRoles.normal } ]; 
        const res = await chai.request(server).post('/v1/users').set('Authorization', await factory.getAdminToken()).send(users)
        res.should.have.status(202);
        res.body.should.be.a('object');
        res.body.users.length.should.be.eql(3);
        res.body.errors.length.should.be.eql(2);
        res.body.errors[0].should.contain(users[0].username);
        res.body.errors[1].should.contain(users[1].username);
        res.body.users[0].username.should.be.eql(users[2].username);
        res.body.users[1].username.should.be.eql(users[3].username);
        res.body.users[2].username.should.be.eql(users[4].username);
    });
});

// Test the /DELETE route
describe('/DELETE users', () => {
    it('it should DELETE a user', async () => {
        await factory.dropContents();
        const user_1 = await factory.createUser("test-username-1", "test-password-1");
        const user_2 = await factory.createUser("test-username-2", "test-password-2");
        const users_before = await User.find();
        users_before.length.should.be.eql(3);
        const res = await chai.request(server).delete('/v1/users/' + user_1._id).set('Authorization', await factory.getAdminToken());
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.username.should.be.eql(user_1.username);
        const users_after = await User.find();
        users_after.length.should.be.eql(2);
    });

    it('it should not DELETE a fake user', async () => {
        await factory.dropContents();;
        const user = await factory.createUser("test-username-1", "test-password-1");
        const users_before = await User.find();
        users_before.length.should.be.eql(2);
        const res = await chai.request(server).delete('/v1/users/fake_user').set('Authorization', await factory.getAdminToken());
        res.should.have.status(errors.resource_not_found.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.resource_not_found.message);
        const users_after = await User.find();
        users_after.length.should.be.eql(2);
    });

    it('it should not DELETE a by non-admin', async () => {
        await factory.dropContents();;
        const user = await factory.createUser("test-username-1", "test-password-1");
        const no_admin = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const users_before = await User.find();
        users_before.length.should.be.eql(2);
        const res = await chai.request(server).delete('/v1/users/' + user._id).set('Authorization', await factory.getUserToken(no_admin));
        res.should.have.status(errors.admin_restricted_access.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.admin_restricted_access.message);
        const users_after = await User.find();
        users_after.length.should.be.eql(2);
    });

    it('it should not DELETE a user owner of a element', async () => {
        await factory.dropContents();;
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = await factory.createElement("test-element-2", user, null, []);
        const users_before = await User.find();
        users_before.length.should.be.eql(2);
        const res = await chai.request(server).delete('/v1/users/' + user._id).set('Authorization', await factory.getAdminToken());
        res.should.have.status(errors.already_used.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.already_used.message);
        const users_after = await User.find();
        users_after.length.should.be.eql(2);
    });

    it('it should not DELETE a user owner of a tag', async () => {
        await factory.dropContents();;
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag = await factory.createTag("test-tag", user);
        const users_before = await User.find();
        users_before.length.should.be.eql(2);
        const res = await chai.request(server).delete('/v1/users/' + user._id).set('Authorization', await factory.getAdminToken());
        res.should.have.status(errors.already_used.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.already_used.message);
        const users_after = await User.find();
        users_after.length.should.be.eql(2);
    });
});

// Test the /PUT route
describe('/PUT user', () => {
    it('it should PUT a user to modify password as admin', async () => {
        factory.dropContents();
        const admin = await factory.createUser("test-username-1", "test-password-1", UserRoles.admin);
        const user = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const modification = { password: 'new_password' };
        const res = await chai.request(server).put('/v1/users/' + user._id).set("Authorization", await factory.getUserToken(admin)).send(modification);
        res.should.have.status(200);
        res.body.should.be.a('object');
    });

    it('it should PUT a user to modify password as himself', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const modification = { password: 'new_password' };
        const res = await chai.request(server).put('/v1/users/' + user._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(200);
        res.body.should.be.a('object');
    });

    it('it should PUT a user to modify password as himself using username', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const modification = { password: 'new_password' };
        const res = await chai.request(server).put('/v1/users/' + user.username).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(200);
        res.body.should.be.a('object');
    });
    
    it('it should not PUT a password to a fake user', async () => {
        factory.dropContents();
        const admin = await factory.createUser("test-username-1", "test-password-1", UserRoles.admin);
        const user = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const modification = { password: 'new_password' };
        const res = await chai.request(server).put('/v1/users/fake-user').set("Authorization", await factory.getUserToken(admin)).send(modification);
        res.should.have.status(errors.resource_not_found.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.resource_not_found.message);
    });

    it('it should not PUT a user with a wrong field', async () => {
        factory.dropContents();
        const admin = await factory.createUser("test-username-1", "test-password-1", UserRoles.admin);
        const user = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const modification = { username: 'new_username' };
        const res = await chai.request(server).put('/v1/users/' + user._id).set("Authorization", await factory.getUserToken(admin)).send(modification);
        res.should.have.status(errors.put_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.put_request_error.message);
        res.body.details.should.contain('Request field cannot be updated ');
    });

    it('it should not PUT a user as another user', async () => {
        factory.dropContents();
        const admin = await factory.createUser("test-username-1", "test-password-1", UserRoles.admin);
        const user = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const other = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const modification = { username: 'new_username' };
        const res = await chai.request(server).put('/v1/users/' + user._id).set("Authorization", await factory.getUserToken(other)).send(modification);
        res.should.have.status(errors.put_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.put_request_error.message);
        res.body.details.should.contain('Request field cannot be updated ');
    });
});
