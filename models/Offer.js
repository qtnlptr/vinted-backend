const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, minlength: 1, maxlength: 50 },
  product_description: { type: String, minlength: 1, maxlength: 500 },
  product_price: { type: Number, max: 100000 },
  product_details: Array,
  product_image: Object,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
