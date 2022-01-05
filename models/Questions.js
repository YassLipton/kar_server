const mongoose = require('mongoose')
const Schema = mongoose.Schema

const questionSchema = new Schema({
  idQuiz: Number,
  idQuestion: Number,
  choices: [
    {
      correct: Boolean,
      selected: Boolean,
      key: Number,
      text: String,
      __typename: String
    }
  ],
  text: String,
  img: String,
  __typename: String
}, {timestamps: true})

const Questions = mongoose.model('Questions', questionSchema)
module.exports = Questions