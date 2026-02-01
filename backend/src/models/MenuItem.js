import mongoose from 'mongoose';
const menuItemSchema = new mongoose.Schema({
    name: {type: String, required: true, trim:true},
    description: {type: String, required: true, trim:true},
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
    }
    },
    {
        timestamps: true
    });
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;