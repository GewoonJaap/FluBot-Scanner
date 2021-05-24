let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let backupSchema = new Schema({
    data: Object,

}, {
    timestamps: {
        currentTime: () => Date.now()
    }
});

module.exports = mongoose.model("Backup", backupSchema);