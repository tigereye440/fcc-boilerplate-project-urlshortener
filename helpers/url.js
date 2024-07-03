const mongoose = require('mongoose');
require('dotenv').config();

let connection = {};

// Define URL Schema
const urlSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    shortId: { type: Number, required: true, unique: true}
});

// Define counter schema for incrementing ShortId
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true},
    counter: { type: Number, default: 0}
});

const char_base62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const tobase62 = (num) => {
    let result = '';
    while (num > 0) {
        result += char_base62[num % 62];
        num = Math.floor(num / 62);
    }
    return result || '0';
}



// Models
connection.Url = mongoose.model("Url", urlSchema);
const counter = mongoose.model("Counter", counterSchema)

// Find a URL by its long form
connection.findOneByUrl = async (url) => {
    try {
        const data = await connection.Url.findOne({ url: url})
        return data;
    } catch (err) {
        console.error("Error finding URL: ", err);
        return null;
    }
};

// Find a URL by its shortID
connection.findOneById = async (shortId) => {
    console.log('fired')
    try {
      
        const data = await connection.Url.findOne({ shortId: shortId });
        return data ? data.url : null;
    } catch (err) {
        console.error("Error finding by shortId: ", err);
        return null;
    }
};

// Get the next shortId
connection.getNextShortId = async () => {
    try {
        const result = await counter.findByIdAndUpdate(
            { _id: 'urlCounter'},
            { $inc: { counter: 1 } },
            { new: true, upsert: true}
        );
        return result.counter;
    } catch (err) {
        console.err("Error getting the next shortId: ", err)
        throw err;
    }
};

// Create and save a new short URL
connection.shortenAndSaveUrl = async (url) => {

    try {

        const urlExists = await connection.findOneByUrl(url);
        if (urlExists) {
            return urlExists.shortId;
        }
        const shortId = tobase62(await connection.getNextShortId());
      
        // Save the new short URL
        const newUrl = new connection.Url({
            url: url,
            shortId: shortId
        });

        const data = await newUrl.save();        
        return data.shortId;
    } catch (err) {
        console.error("Error creating and saving new short URL: ", err);
        return null;
    }
}


module.exports = connection;
