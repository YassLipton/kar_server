const express = require('express')
const app = express()
const http = require('http').createServer(app)
const jwt = require("jsonwebtoken")
const crypto = require('crypto')
const mongoose = require('mongoose')

const Questions = require('./models/Questions')
const QuestionsCorrected = require('./models/QuestionsCorrected')
const Quiz1 = require('./Quiz/Quiz1')
const Quiz2 = require('./Quiz/Quiz2')
const Quiz3 = require('./Quiz/Quiz3')

const Users = require('./models/Users')

const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Kar RESTful API',
      description: 'This is the server of a simple quiz application.',
      contact: {
        name: 'contact name'
      },
      servers: ['http://192.168.1.26:3500']
    },
  },
  apis: ['app.js']
}

const swaggetDocs = swaggerJsDoc(swaggerOptions)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggetDocs))

require("dotenv").config()

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
  next();
})

let bodyParser = require('body-parser')

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))

const dbURI = '<connection url>'
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => console.log('connected to db'))
  .catch((err) => console.log(err))

const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader.split(" ")[1]
  
  if (token == null) res.sendStatus(400).send("Token not present")

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) { 
      res.status(401).send("Token invalid")
    }
    else {
      req.user = user
      next()
    }
  })
}

app.get('/add-quiz', (req, res) => {

  const currentQuiz = Quiz3

  for (let i = 0; i < currentQuiz.length; i++) {
    for (let j = 0; j < currentQuiz[i].length; j++) {
      const Question = new Questions(currentQuiz[i][j])
      Question.save()
        .then((result) => {
          res.send(result)
        })
        .catch((err) => {  
          console.log(err)
        })
    }
  }
})

/**
 * @swagger
 * /all-questions:
 *   post:
 *     summary: Return all questions of the selected quiz.
 *     tags:
 *       - quiz
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: quiz
 *         description: The quiz to select
 *         schema:
 *           type: object
 *           required:
 *             - idQuiz
 *           properties:
 *             idQuiz:
 *               type: number
 *               minimum: 1
 *               maximum: 8
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               idQuiz:
 *                 type: integer
 *                 description: The quiz ID.
 *               idQuestion:
 *                 type: integer
 *                 description: The question ID.
 *               choices:
 *                 type: array
 *                 description: Choices associated to the question.
 *                 items:
 *                   type: object
 *                   properties: 
 *                     correct: 
 *                       type: boolean
 *                     key: 
 *                       type: number
 *                     text: 
 *                       type: string
 *                     __typename: 
 *                       type: string
 *                     _id: 
 *                       type: string
 *               text:
 *                 type: string
 *                 description: Text of the question.
 *               img:
 *                 type: string
 *                 description: Base64 image of the question.
 *               __typename:
 *                 type: string
 *       201:
 *         description: Created
 *        
 */
app.post('/all-questions', (req, res) => {
  
  const idQuiz = req.body.idQuiz

  Questions.find({idQuiz}).select({_id: 0, createdAt: 0, updatedAt: 0, __v: 0})
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.log(err)
    })
})

/**
 * @swagger
 * /all-corrected-questions:
 *   post:
 *     summary: Return all questions of the selected corrected quiz.
 *     tags:
 *       - quiz
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: corrected quiz
 *         description: The corrected quiz to select
 *         schema:
 *           type: object
 *           required:
 *             - _idUser
 *             - idCorrectedQuiz
 *           properties:
 *             _idUser:
 *               type: string
 *             idCorrectedQuiz:
 *               type: number
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               idQuestion:
 *                 type: integer
 *                 description: The question ID.
 *               isValidated:
 *                 type: boolean
 *                 description: Is the question validated.
 *               choices:
 *                 type: array
 *                 description: Choices associated to the question.
 *                 items:
 *                   type: object
 *                   properties: 
 *                     correct: 
 *                       type: boolean
 *                     selected: 
 *                       type: boolean
 *                     key: 
 *                       type: number
 *                     text: 
 *                       type: string
 *                     __typename: 
 *                       type: string
 *                     _id: 
 *                       type: string
 *               text:
 *                 type: string
 *                 description: Text of the question.
 *               __typename:
 *                 type: string
 *        
 */
app.post('/all-corrected-questions', (req, res) => {
  
  const _idUser = req.body._idUser
  const idCorrectedQuiz = req.body.idCorrectedQuiz

  QuestionsCorrected.find({_idUser, idCorrectedQuiz}).select({_id: 0, _idUser: 0, idQuiz: 0, idCorrectedQuiz: 0, createdAt: 0, updatedAt: 0})
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.log(err)
    })
})

const QuizCorrection = (result) => {
  let final = []
      let questionsResult = []
      for (let i = 0; i < result.length; i++) {
        questionsResult.push(result[i]['_id'])
      }
      // questionsResult = questionsResult.sort(compare)
      for (let i = 0; i < questionsResult.length; i++) {
        const correctedQuizExists = final.filter(f => f.idCorrectedQuiz == questionsResult[i].idCorrectedQuiz).length > 0
        if (!correctedQuizExists) {
          final.push({
            idQuiz: questionsResult[i].idQuiz,
            idCorrectedQuiz: questionsResult[i].idCorrectedQuiz,
            correct: [],
            wrong: []
          })
          questionsResult.filter(q => q.idCorrectedQuiz == questionsResult[i].idCorrectedQuiz).map(item => {
            if (item.isValidated) {
              const isWrong = final[final.length - 1].wrong.filter(q => q.idQuestion == item.idQuestion).length > 0
              if (!isWrong) {
                final[final.length - 1].correct.push({
                  idQuestion: item.idQuestion
                })
              }
            } else {
              final[final.length - 1].wrong.push({
                idQuestion: item.idQuestion
              })
              final[final.length - 1].correct.map((correctItem, correctIndex) => {
                if (correctItem.idQuestion == item.idQuestion) {
                  // console.log(final[final.length - 1].correct)
                  final[final.length - 1].correct.splice(correctIndex, 1)
                  // console.log(final[final.length - 1].correct)
                }
              })
              // if (final[final.length - 1].correct) {
              //   for (let j = 0; j < final[final.length - 1].correct.length; j++) {
              //     console.log(item.idCorrectedQuiz, final[final.length - 1].correct[j], item.idQuestion)
              //     if (final[final.length - 1].correct[j].idQuestion == item.idQuestion) final = final[final.length - 1].correct.splice(j, 1)
              //   }
              // }
            }
          })
        }
      }
      return final
}

/**
 * @swagger
 * /add-quiz-corrected:
 *   put:
 *     summary: Save quiz (with user answers) in the DB.
 *     tags:
 *       - quiz
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: quiz
 *         description: Quiz with user answers.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               idQuiz:
 *                 type: integer
 *                 description: The quiz ID.
 *               idQuestion:
 *                 type: integer
 *                 description: The question ID.
 *               choices:
 *                 type: array
 *                 description: Choices associated to the question.
 *                 items:
 *                   type: object
 *                   properties: 
 *                     correct: 
 *                       type: boolean
 *                     selected: 
 *                       type: boolean
 *                     key: 
 *                       type: number
 *                     text: 
 *                       type: string
 *                     __typename: 
 *                       type: string
 *                     _id: 
 *                       type: string
 *               isValidated:
 *                 type: boolean
 *                 description: Is the question validated.
 *               text:
 *                 type: string
 *                 description: Text of the question.
 *               __typename:
 *                 type: string
 *     responses:
 *       201:
 *         description: Quiz successfully saved.
 *        
 */
app.put('/add-quiz-corrected', (req, res) => {

  const currentQuiz = req.body.quizCorrected

  // console.log(currentQuiz)

  QuestionsCorrected.find().select({idCorrectedQuiz: 1}).sort({createdAt: -1}).limit(1)
    .then((result) => {
      let lastCorrectedQuizId = 0

      if (result.length > 0) lastCorrectedQuizId = result[0].idCorrectedQuiz

      for (let i = 0; i < currentQuiz.length; i++) {
        currentQuiz[i].idCorrectedQuiz = lastCorrectedQuizId + 1
        const Question = new QuestionsCorrected(currentQuiz[i])
        Question.save()
          .then((result) => {
            console.log(result)

            if (i == currentQuiz.length - 1) {
              QuestionsCorrected.aggregate([
                { 
                  $project: {
                    _id: 0,
                    idQuestion: 1,
                    idCorrectedQuiz: 1,
                    isValidated: 1
                  }
                },
                { 
                  $group: {
                    _id: {
                      "idQuestion": "$idQuestion",
                      "idCorrectedQuiz": "$idCorrectedQuiz",
                      "isValidated" : "$isValidated"
                    }
                  }
                },
                { 
                  $sort: {
                    "_id.idCorrectedQuiz": -1
                  }
                },
                { 
                  $match: {
                    "_id.idCorrectedQuiz": lastCorrectedQuizId + 1
                  }
                }
              ])
                .then((result) => {
                  // res.send({
                  //   success: true,
                  //   correctedQuiz: QuizCorrection(result)[0]
                  // })
                  res.status(201).send('Quiz successfully saved.')
                })
                .catch((err) => {
                  console.log(err)
                })
              }
          })
          .catch((err) => {
            console.log(err)
          })
      }

      // res.send({success: true, currentCorrectQuiz: lastCorrectedQuizId + 1})
    })
    .catch((err) => {
      console.log(err)
      res.send({success: false})
    })
})

/**
 * @swagger
 * /corrected-quiz-list/{limit}:
 *   get:
 *     summary: Return last corrected quizzes.
 *     tags:
 *       - quiz
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: authorization
 *         description: An authorization header.
 *         schema:
 *           type: string
 *           required:
 *             - userToken
 *           properties:
 *             userToken:
 *               type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               idQuiz:
 *                 type: integer
 *                 description: The quiz ID.
 *               idCorrectQuiz:
 *                 type: integer
 *                 description: The corrected quiz ID.
 *               correct:
 *                 type: array
 *                 description: Correct questions list.
 *                 items:
 *                   type: object
 *                   properties: 
 *                     idQuestion: 
 *                       type: number
 *               wrong:
 *                 type: array
 *                 description: Wrong questions list.
 *                 items:
 *                   type: object
 *                   properties: 
 *                     idQuestion: 
 *                       type: number
 *        
 */
app.get('/corrected-quiz-list/:limit', validateToken, (req, res) => {
  
  const idUser = req.user.id
  const limit = req.params.limit

  QuestionsCorrected.aggregate([
    { 
      $project: {
        _id: 0,
        _idUser: 1,
        idQuiz: 1,
        idQuestion: 1,
        idCorrectedQuiz: 1,
        isValidated: 1
      }
    },
    { 
      $group: {
        _id: {
          "_idUser": "$_idUser",
          "idQuiz": "$idQuiz",
          "idQuestion": "$idQuestion",
          "idCorrectedQuiz": "$idCorrectedQuiz",
          "isValidated" : "$isValidated"
        }
      }
    },
    { 
      $sort: {
        "_id.idCorrectedQuiz": -1
      }
    },
    { 
      $match: {
        "_id._idUser": idUser
      }
    }
  ])
    .then((result) => {
      if (limit != undefined) {
        if (result.length > 0) {
          let quizList = []
          console.log(result.length)
          if (result.length > 3) {
            for (let i = 0; i < limit; i++) {
              if (QuizCorrection(result)[i]) quizList.push(QuizCorrection(result)[i])
            }
          } else {
            for (let i = 0; i < result.length; i++) {
              quizList.push(QuizCorrection(result)[i])
            }
          }
          res.send(quizList)
        } else {
          res.send(result)
        }
      } else {
        res.send(QuizCorrection(result))
      }
    })
    .catch((err) => {
      console.log(err)
    })
})

// app.post('/corrected-quiz-list', (req, res) => {
  
//   const idUser = req.body.idUser

//   QuestionsCorrected.aggregate([
//     { 
//       $project: {
//         _id: 0,
//         idQuestion: 1,
//         idCorrectedQuiz: 1,
//         isValidated: 1
//       }
//     },
//     { 
//       $group: {
//         _id: {
//           "_idUser": "$_idUser",
//           "idQuestion": "$idQuestion",
//           "idCorrectedQuiz": "$idCorrectedQuiz",
//           "isValidated" : "$isValidated"
//         }
//       }
//     },
//     { 
//       $sort: {
//         "_id.idCorrectedQuiz": -1
//       }
//     },
//     { 
//       $match: {
//         "_id._idUser": idUser
//       }
//     }
//   ])
//     .then((result) => {
//       res.send(QuizCorrection(result))
//     })
//     .catch((err) => {
//       console.log(err)
//     })
// })

app.get('/add-user', (req, res) => {
  const User = new Users({
    username: 'test1@mail.com',
    password: crypto.createHash('md5').update('dodo').digest('hex'),
    firstName: 'John',
    lastName: 'Doe'
  })
  User.save()
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.log(err)
    })
})

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connect user to the website.
 *     tags:
 *       - user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Credentials of user to login.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               description: Email from user input.
 *             password:
 *               type: string
 *               description: Password from user input.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: object
 *           required: 
 *             - successfullyLogged
 *           properties:
 *             successfullyLogged:
 *               type: boolean
 *               description: Is user successfully logged in.
 *             accessToken:
 *               type: string
 *               description: Token of the current session.
 *        
 */
app.post('/login', (req, res) => {
  
  const username = req.body.username
  const password = crypto.createHash('md5').update(req.body.password).digest('hex') 

  console.log(password)

  Users.find({username, password}).select({createdAt: 0, updatedAt: 0})
    .then((result) => {
      if (result.length > 0) {
        const accessToken = generateAccessToken({ 
          id: result[0]._id,
          username: result[0].username,
          firstName: result[0].firstName,
          lastName: result[0].lastName
         })
        const refreshToken = generateRefreshToken({ 
          id: result[0]._id,
          firstName: result[0].firstName,
        })
        res.send({
          successfullyLogged: true,
          user: result[0],
          accessToken: accessToken, 
          refreshToken: refreshToken
        })
      } else {
        res.send({
          successfullyLogged: false
        })
      }
    })
    .catch((err) => {
      console.log(err)
      res.send({
        successfullyLogged: false
      })
    })
})

/**
 * @swagger
 * /register:
 *   post:
 *     summary: User to register on the DB.
 *     tags:
 *       - user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Credentials of user to register.
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - firstName
 *             - lastName
 *             - email
 *             - password
 *           properties:
 *             firstName:
 *               type: string
 *               description: First name from user input.
 *             lastName:
 *               type: string
 *               description: Last name from user input.
 *             email:
 *               type: string
 *               description: Email from user input.
 *             password:
 *               type: string
 *               description: Password from user input.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: object
 *           required: 
 *             - successfullyRegistered
 *           properties:
 *             successfullyRegistered:
 *               type: boolean
 *               description: Is user successfully registered.
 *             accessToken:
 *               type: string
 *               description: Token of the current session.
 *        
 */
app.post('/register', (req, res) => {
  
  const firstName = req.body.firstName
  const lastName = req.body.lastName
  const username = req.body.username
  const password = crypto.createHash('md5').update(req.body.password).digest('hex') 

  const User = new Users({
    username,
    password,
    firstName,
    lastName
  })
  User.save()
    .then((result) => {
      console.log(result)
      const accessToken = generateAccessToken({ 
        id: result._id,
        username: result.username,
        firstName: result.firstName,
        lastName: result.lastName
       })
      res.send({
        successfullyRegistered: true,
        user: result,
        accessToken: accessToken
      })
    })
    .catch((err) => {
      console.log(err)
    })
})

generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "20m" })
}

let refreshTokens = []
generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "20m" })
  refreshTokens.push(refreshToken)
  return refreshToken
}

app.post("/refreshToken", (req,res) => {
  if (!refreshTokens.includes(req.body.token)) res.status(400).send("Refresh Token Invalid")
  refreshTokens = refreshTokens.filter((c) => c != req.body.token)
  
  const accessToken = generateAccessToken ({user: req.body.name})
  const refreshToken = generateRefreshToken ({user: req.body.name})
  
  res.json({accessToken: accessToken, refreshToken: refreshToken})
})

/**
 * @swagger
 * /loginCheck:
 *   get:
 *     summary: Check if user is logged.
 *     tags:
 *       - user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: authorization
 *         description: An authorization header containing the user's token.
 *     responses:
 *       200:
 *         description: Token is valid.
 *         schema:
 *           type: object
 *           properties:
 *             successfullyRegistered:
 *               type: boolean
 *               description: Is user successfully registered.
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             username:
 *               type: string
 *             exp:
 *               type: number
 *       401:
 *         description: Token is not valid.
 *        
 */
app.get("/loginCheck", validateToken, (req, res)=>{
  res.status(200).send(req.user)
})

/**
 * @swagger
 * /logout:
 *   delete:
 *     summary: User to disconnect.
 *     tags:
 *       - user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Token of the current user's session.
 *         schema:
 *           type: object
 *           properties:
 *             userToken:
 *               type: string
 *               description: Token of the current user's session.
 *     responses:
 *       204:
 *         description: Successfully logged out
 *        
 */
app.delete("/logout", (req,res)=>{
  res.status(204).send("Successfully logged out")
})

const PORT = process.env.PORT || 5000

http.listen(PORT, function(){
  console.log(`listening on *:${PORT}`)
})
