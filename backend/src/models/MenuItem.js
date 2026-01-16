import mongoose from 'mongoose';
const menuItemSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Restaurant ID is required'],
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
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
    },
}, {
    timestamps: true
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;