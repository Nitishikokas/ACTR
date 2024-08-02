var express = require('express');
var path = require('path');
var cors=require('cors')

var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use('/users', usersRouter);



app.listen(8000, ()=>{
  console.log("gh",8000);
})
module.exports = app;
