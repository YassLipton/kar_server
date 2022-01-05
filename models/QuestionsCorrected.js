const mongoose = require('mongoose')
const Schema = mongoose.Schema

const correctedQuestionSchema = new Schema({
  _idUser: String,
  idQuiz: Number,
  idCorrectedQuiz: Number,
  idQuestion: Number,
  isValidated: Boolean,
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
  __typename: String
}, {timestamps: true})

const CorrectedQuestions = mongoose.model('Corrected_Questions', correctedQuestionSchema)
module.exports = CorrectedQuestions