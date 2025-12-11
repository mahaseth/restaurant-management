const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: {
            values: ["appetizer", "main", "dessert", "drink", "side"],
            message: "{VALUE} is not a valid category. Use: appetizer, main, dessert, drink, side"
        },
        lowercase: true
    },
    available: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        default: ""
    },
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;