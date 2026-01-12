const mongoose = require('mongoose');
const { Schema } = mongoose;

const CategorySchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    name: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('category', CategorySchema);