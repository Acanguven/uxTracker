var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var bcrypt = require('bcrypt-nodejs');

var SiteSchema = new Schema({
    title: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
    uniqueKey: { type: String, required: true },
    owner: { type: ObjectId },
    activated: { type: Boolean, default: true },
    settings: { type: Object, default: {} },
    pathFlow: {type: Object, default : {}},
    update:{type:Object,default:{}}
});

SiteSchema.pre('save', function (next) {
    var site = this;
    if (!site.isModified('domain')) return next();
    if (site.uniqueKey.length > 5) return next();
    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(site.domain, salt, null, function (err, hash) {
            if (err) return next(err);
            site.uniqueKey = hash.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            next();
        });
    });
});


module.exports = mongoose.model('Site', SiteSchema);