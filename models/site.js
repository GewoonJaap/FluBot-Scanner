let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let siteSchema = new Schema({
    URL: String,
    FullLink: String,
    Active: Boolean,

}, {
    timestamps: {
        currentTime: () => Date.now()
    }
});

module.exports = mongoose.model("Site", siteSchema);