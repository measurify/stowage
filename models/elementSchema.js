const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');
mongoose.Promise = global.Promise;

const Tag = mongoose.model('Tag');
const User = mongoose.model('User');

/**
 * @swagger
 * definitions:
 *      element:
 *          type: object
 *          required:
 *              - _id
 *              - owner
 *              - content
 *          properties:
 *              _id: 
 *                  type: string
 *              contetn: 
 *                  description: a string document to store the element meaning
 *                  type: string 
 *              tags: 
 *                  description: list of labels related to the element
 *                  type: array
 *                  items:
 *                      $ref: '#/paths/definitions/tag'
 */
const elementSchema = new mongoose.Schema({
    _id: { type: String, required: "Please, supply an _id" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: true },
    tags: [{ type: String, ref: 'Tag' }],
    content: { type: String, required: "Please, supply the element contents" },
    timestamp: {type: Date, default: Date.now, select: false },
    lastmod: {type: Date, default: Date.now, select: false }
});

elementSchema.set('toJSON', { versionKey: false });
elementSchema.index({ owner: 1 });
elementSchema.plugin(paginate);
elementSchema.plugin(require('mongoose-autopopulate'));

// validate tags
elementSchema.path('tags').validate({
    validator: async function (values) {
        if(!values) return true;
        for (let i = 0; i < values.length; i++) {
            let tag = await Tag.findById(values[i]);
            if (!tag) return false;
        };
        return true;
    },
    message: 'Tag not existent'
});

// validate owner
elementSchema.path('owner').validate({
    validator: async function (value) {
        let user = await User.findById(value);
        if (!user) return false;
        return true;
    },
    message: 'User not existent'
});

// validate id
elementSchema.pre('save', async function () {
    const res = await this.constructor.findOne({ _id: this._id });
    if (res) throw new Error('Element validation failed: the _id is already used (' + this._id + ')');
});

module.exports = mongoose.models.Element || mongoose.model('Element', elementSchema);
