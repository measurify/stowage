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
const Element = mongoose.model('Element');
const UserRoles = require('../types/userRoles.js');
const errors = require('../commons/errors.js');

chai.use(chaiHttp);

// Test the /GET route
describe('/GET element', () => {
    it('it should GET all the elements', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        await factory.createElement("test-element-1", user, JSON.stringify({value: 'content_1'}), []);
        await factory.createElement("test-element-2", user, JSON.stringify({value: 'content_2'}), []);
        const res = await chai.request(server).get('/v1/elements').set("Authorization", await factory.getUserToken(user));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(2);
    });

    it('it should GET just his elements', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const other = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        await factory.createElement("test-element-1", user, JSON.stringify({value: 'content_1'}), []);
        await factory.createElement("test-element-2", user, JSON.stringify({value: 'content_2'}), []);
        await factory.createElement("test-element-3", other, JSON.stringify({value: 'content_3'}), []);
        await factory.createElement("test-element-4", user, JSON.stringify({value: 'content_4'}), []);
        await factory.createElement("test-element-5", other, JSON.stringify({value: 'content_5'}), []);
        await factory.createElement("test-element-6", user, JSON.stringify({value: 'content_6'}), []);
        const res = await chai.request(server).get('/v1/elements').set("Authorization", await factory.getUserToken(user));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(4);
    });

    it('it should GET a specific element', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = await factory.createElement("test-element-1", user, JSON.stringify({value: 'content_1'}), []);
        const res = await chai.request(server).get('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user));
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body._id.should.eql(element._id.toString());
    });

    it('it should not GET a fake element', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = await factory.createElement("test-element-1", user, JSON.stringify({value: 'content_1'}), []);
        const res = await chai.request(server).get('/v1/elements/fake-element').set("Authorization", await factory.getUserToken(user));
        res.should.have.status(errors.resource_not_found.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.resource_not_found.message);
    });

    it('it should not GET an element of another user', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const other = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const element = await factory.createElement("test-element-1", other, JSON.stringify({value: 'content_1'}), []);
        const res = await chai.request(server).get('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user));
        res.should.have.status(errors.not_yours.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.not_yours.message);
    });
});

// Test the /POST route
describe('/POST element', () => {
    it('it should not POST an element without _id field', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = {}
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(element);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.contain(errors.post_request_error.message);
    });

    it('it should not POST an element with a fake tag', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = { _id: "test-element-1", tags: ["fake-tag"] };
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(element);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.contain(errors.post_request_error.message);
        res.body.details.should.contain('Tag not existent');
    });

    it('it should not POST an element without content', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = { _id: "test-element-1"};
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(element);
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.contain(errors.post_request_error.message);
        res.body.details.should.contain('Please, supply the element contents');
    });

    it('it should POST an element', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = { _id: "test-element-1", content: "content-test" }
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(element);
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('_id');
        res.body._id.should.be.eql(element._id);
    });

    it('it should not POST an element with already existant _id field', async () => {
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = { _id: "test-element-1", content: "content-test" }
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(element)
        res.should.have.status(errors.post_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.be.eql(errors.post_request_error.message);
        res.body.details.should.contain('the _id is already used');
    });

    it('it should GET the element posted before', async () => {
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const res = await chai.request(server).get('/v1/elements').set("Authorization", await factory.getUserToken(user));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(1);
        res.body.docs[0]._id.should.be.eql("test-element-1");
    });

    it('it should POST a list of elements', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const elements = [{ _id: "test-element-1", content: "content-test" }, 
                          { _id: "test-element-2", content: "content-test" }];
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(elements)
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.elements[0]._id.should.be.eql(elements[0]._id);
        res.body.elements[1]._id.should.be.eql(elements[1]._id);
    });

    it('it should POST only not existing elements from a list', async () => {
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const elements = [{ _id: "test-element-1", content: "content-test" },
                          { _id: "test-element-2", content: "content-test" },
                          { _id: "test-element-3", content: "content-test" },
                          { _id: "test-element-4", content: "content-test" },
                          { _id: "test-element-5", content: "content-test" }];
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(elements)
        res.should.have.status(202);
        res.body.should.be.a('object');
        res.body.elements.length.should.be.eql(3);
        res.body.errors.length.should.be.eql(2);
        res.body.errors[0].should.contain(elements[0]._id);
        res.body.errors[1].should.contain(elements[1]._id);
        res.body.elements[0]._id.should.be.eql(elements[2]._id);
        res.body.elements[1]._id.should.be.eql(elements[3]._id);
        res.body.elements[2]._id.should.be.eql(elements[4]._id);
    });

    it('it should POST an element with tags', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag = await factory.createTag("test-tag-1", user);
        const element = { _id: "test-element-1", content: "content-test", tags: [tag] };
        const res = await chai.request(server).post('/v1/elements').set("Authorization", await factory.getUserToken(user)).send(element)
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('_id');
        res.body._id.should.be.eql(element._id);
        res.body.tags.length.should.be.eql(1);
    });
});

// Test the /DELETE route
describe('/DELETE element', () => {
    it('it should DELETE an element', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = await factory.createElement("test-element-1", user, null, []);
        const elements_before = await Element.find();
        elements_before.length.should.be.eql(1);
        const res = await chai.request(server).delete('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user));
        res.should.have.status(200);
        res.body.should.be.a('object');
        const elements_after = await Element.find();
        elements_after.length.should.be.eql(0);
    });

    it('it should not DELETE a fake element', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = await factory.createElement("test-element-1", user, null, []);
        const elements_before = await Element.find();
        elements_before.length.should.be.eql(1);
        const res = await chai.request(server).delete('/v1/elements/fake_element').set("Authorization", await factory.getUserToken(user));
        res.should.have.status(errors.resource_not_found.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.resource_not_found.message);
        const elements_after = await Element.find();
        elements_after.length.should.be.eql(1);
    });

    it('it should not DELETE an element owned by another user', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const other = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const element = await factory.createElement("test-element-1", other, null, []);;
        const res = await chai.request(server).delete('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user));
        res.should.have.status(errors.restricted_access_delete.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.restricted_access_delete.message);
    });
});

// Test the /PUT route
describe('/PUT element', () => {
    it('it should PUT an element to add a tag', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag_1 = await factory.createTag("test-tag-1", user);
        const tag_2 = await factory.createTag("test-tag-2", user);
        const tag_3 = await factory.createTag("test-tag-3", user);
        const element = await factory.createElement("test-element-1", user, null, [tag_1, tag_2]);
        const modification = { tags: { add: [tag_3._id] } };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('_id');
        res.body.tags.length.should.be.eql(3);
    });

    it('it should PUT an element to remove a tag', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag_1 = await factory.createTag("test-tag-1", user);
        const tag_2 = await factory.createTag("test-tag-2", user);
        const tag_3 = await factory.createTag("test-tag-3", user);
        const element = await factory.createElement("test-element-1", user, null, [tag_1, tag_2, tag_3]);
        const modification = { tags: { remove: [tag_2._id] } };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('_id');
        res.body.tags.length.should.be.eql(2);
    });

    it('it should PUT an element to add and remove tags', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag_1 = await factory.createTag("test-tag-1", user);
        const tag_2 = await factory.createTag("test-tag-2", user);
        const tag_3 = await factory.createTag("test-tag-3", user);
        const tag_4 = await factory.createTag("test-tag-4", user);
        const tag_5 = await factory.createTag("test-tag-5", user);
        const tag_6 = await factory.createTag("test-tag-6", user);
        const tag_7 = await factory.createTag("test-tag-7", user);
        const element = await factory.createElement("test-element-1", user, null, [tag_1, tag_2, tag_3, tag_4]);
        const modification = { tags: { remove: [tag_2._id, tag_3._id], add: [tag_5._id, tag_6._id, tag_7._id] } };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('_id');
        res.body.tags.length.should.be.eql(5);
    });

    it('it should not PUT an element adding a fake tag', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag_1 = await factory.createTag("test-tag-1", user);
        const tag_2 = await factory.createTag("test-tag-2", user);
        const element = await factory.createElement("test-element-1", user, null, [tag_1, tag_2]);
        const modification = { tags: { add: ["fake_tag"] } };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(errors.put_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.contain(errors.put_request_error.message);
        res.body.details.should.contain('Resource to be added to the list not found');
    });

    it('it should not PUT a element removing a fake tag', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag_1 = await factory.createTag("test-tag-1", user);
        const tag_2 = await factory.createTag("test-tag-2", user);
        const element = await factory.createElement("test-element-1", user, null, [tag_1, tag_2]);
        const modification = { tags: { remove: ["fake_tag"] } };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(errors.put_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.contain(errors.put_request_error.message);
        res.body.details.should.contain('Resource to be removed from list not found');
    });

    it('it should not PUT a fake element', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag_1 = await factory.createTag("test-tag-1", user);
        const tag_2 = await factory.createTag("test-tag-2", user);
        const element = await factory.createElement("test-element-1", user, null, [tag_1, tag_2]);
        const modification = { tags: { remove: ["tag_1"] } };
        const res = await chai.request(server).put('/v1/elements/fake_element').set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(errors.resource_not_found.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.resource_not_found.message);
    });

    it('it should not PUT a thing with a wrong field', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const tag_1 = await factory.createTag("test-tag-1", user);
        const tag_2 = await factory.createTag("test-tag-2", user);
        const element = await factory.createElement("test-element-1", user, null, [tag_1, tag_2]);
        const modification = { fakefield: "fake-value" };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(errors.put_request_error.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.put_request_error.message);
        res.body.details.should.contain('Request field cannot be updated ');
    });

    it('it should PUT an element to modify contents', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const element = await factory.createElement("test-element-1", user, null, []);
        const modification = { content: "new_content" };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('_id');
        res.body.content.should.be.eql("new_content");
    });

    it('it should not PUT an element owned by another user', async () => {
        factory.dropContents();
        const user = await factory.createUser("test-username-1", "test-password-1", UserRoles.normal);
        const other = await factory.createUser("test-username-2", "test-password-2", UserRoles.normal);
        const element = await factory.createElement("test-element-1", other, null, []);
        const modification = { content: "new_content" };
        const res = await chai.request(server).put('/v1/elements/' + element._id).set("Authorization", await factory.getUserToken(user)).send(modification);
        res.should.have.status(errors.restricted_access_modify.status);
        res.body.should.be.a('object');
        res.body.message.should.contain(errors.restricted_access_modify.message);
    });
});
