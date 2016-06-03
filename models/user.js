var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, index: { unique: true }, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: { type: String },
    upgraded: {type: Number, default: 0}
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(5, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, null,function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};


module.exports = mongoose.model('User', UserSchema);