const mongoose = require('mongoose')
const Schema = mongoose.Schema

const connectionSchema = new Schema({
  username: String,
  token: String,
}, {timestamps: true})

const Connections = mongoose.model('Connections', connectionSchema)
module.exports = Connections