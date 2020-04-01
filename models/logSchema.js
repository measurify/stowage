const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');
 
const logsSchema = new mongoose.Schema({ 
    date: { type: Date },
    log: { type: String }    
});

logsSchema.plugin(paginate);


module.exports = mongoose.models.Logs || mongoose.model('Logs', logsSchema);
