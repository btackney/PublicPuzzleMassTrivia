/*global jQuery*/

var async = require('async');

var interval = null;

var paused = false;

var currentTime = Date.now();
var lastQuestionTime = Date.now();

var answers = [];
var images = [];

var correctForStats;
var questionReadyYet;

var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var express = require('express');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var sockets = [];

var latestSocket;

var gameData = {
  'defaultTime': 10000,
  'defaultHintTime': 5000
};

var theQuestions = [];
//var theIndex = 0;

var correctAnswers = []; //correct answer is always 1st of stats choices a0 a4 a8 a12 a16 but palced in random order
//var answerUp = [];
var currentQuestionIndex = 0;

// var maintenanceAdminLogin = "kurtz";
// var maintenanceAdminPassword = "brendan";

// var statsQuestions = [
//   "if one letter is randomly selected from the word STATISTICS, what are the odds against selecting a T",
//   "In a large population 56% of the people have been vaccinated. If 4 people are randomly selected what is the probability that at least one of them has been vaccinated? (round answer to 5 decimal places)",
//   "the statistics committee must appoint a test committee with four different members. There are 12 members. How many different ways can the committee be appointed?",
//   "Which of the following cannot be a probability?",
//   "a random sample of 10 of the 2012 soccer players produced the following ages: 33,25,28,20,21,35,26,32,28,31. Find the standard deviation"
// ];

// var statsChoices = [
//   "D) 7:3", "B) 10:3", "C)3:7", "A) 3:10",
//   "D) 0.9625", "A)0.0983", "B) 0.9017", "C) 0.0375",
//   "A) 495", "B) 11,880", "C) 48", "D) 12",
//   "D) -2/3", "A)0", "B)2/3", "C) 1",
//   "B)5.0", "A) 27.9", "C)28", "D)15"
// ];

function Start() { //todo implement with json statsQuestion and stats Choices

  //var uniqueNumbers = [0,1,2,3];

  // for (var i = 0; i < statsQuestions.length; i++) {
  //   var correct = statsChoices[i * 4];
  //   correctAnswers.push[correct]; //push correct answer into correct answer array

  //   createQuestion(-1, //so its pushed to array 
  //     statsQuestions[i], //todo can add letters abcd manually infront of each and still have random ans choice there
  //     statsChoices[(i * 4)], // + getUnique(uniqueNumbers)],
  //     statsChoices[(i * 4) + 1], //getUnique(uniqueNumbers)],
  //     statsChoices[(i * 4) + 2], //getUnique(uniqueNumbers)],
  //     statsChoices[(i * 4) + 3], //getUnique(uniqueNumbers)],
  //     correctAnswers[i],
  //     'hint',
  //     gameData.defaultHintTime,
  //     gameData.defaultTime + Math.random() * 5000,
  //     'STATISTICS', //category not implemented
  //     './img/3.png'
  //   ); //[i]);

    //console.log("reset unique")
    //uniqueNumbers = [0,1,2,3];

  //}

}

function scramble(str) {
  var scrambled = '',
    src = str.split(''),
    randomNum;
  while (src.length > 1) {
    randomNum = Math.floor(Math.random() * src.length);
    scrambled += src[randomNum];
    src.splice(randomNum, 1);
  }
  scrambled += src[0];
  return scrambled;
}

function getUnique(uniqueNumbers) {
  var random = Math.floor(Math.random() * uniqueNumbers.length);
  var unique = uniqueNumbers[random];
  uniqueNumbers.splice(random, 1);
  //console.log("random & unique", random, unique);
  return unique;
}

Start();

function removeQuestion(index) {

  console.log(theQuestions.length);
  try {
    theQuestions.splice(index, 1);
  }
  catch (e) {}

  console.log(theQuestions.length);
}

function createQuestion(theIndex, tq, c1, c2, c3, c4, cc, hint, hintTime, timeLimit, category, ii) {
  //if (ii == "") ii = "./img/3.png";
  var newQ = new Object();
  newQ.theQuestion = tq;
  newQ.choice1 = c1;
  newQ.choice2 = c2;
  newQ.choice3 = c3;
  newQ.choice4 = c4;
  newQ.correct = cc;
  newQ.hint = hint;
  newQ.hintTime = hintTime;
  newQ.timeLimit = timeLimit;
  newQ.category = category;
  newQ.imgURL = "" + ii; //console.log(ii);
  newQ.correctPosition = null;
  if (theIndex < theQuestions.length && theIndex > -1) {
    console.log("Editing question at index: " + theIndex);
    theQuestions[theIndex] = newQ;
    console.log("Question edited: " + theQuestions[theIndex].theQuestion);
  }
  else {
    theQuestions.push(newQ);
    //console.log("img url: " + ii);
  }
}

function setNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex > theQuestions.length - 1) currentQuestionIndex = 0;
}

var questionSet = false;
var readyQuestion = new Object();

function getQuestion() {

  if (questionSet == false) {

    // console.log("theQuestions before " + theQuestions[currentQuestionIndex].theQuestion + theQuestions[currentQuestionIndex].choice1 +
    //   theQuestions[currentQuestionIndex].choice2 + theQuestions[currentQuestionIndex].choice3 + theQuestions[currentQuestionIndex].choice4);

    var uniqueNumbers = [0, 1, 2, 3];

    //Copy Object theQuestions to ready Question
    readyQuestion = new Object();
    readyQuestion.theQuestion = theQuestions[currentQuestionIndex].theQuestion;
    readyQuestion.choice1 = theQuestions[currentQuestionIndex].choice1;
    readyQuestion.choice2 = theQuestions[currentQuestionIndex].choice2;
    readyQuestion.choice3 = theQuestions[currentQuestionIndex].choice3;
    readyQuestion.choice4 = theQuestions[currentQuestionIndex].choice4;
    readyQuestion.correct = theQuestions[currentQuestionIndex].correct;
    readyQuestion.hint = theQuestions[currentQuestionIndex].hint;
    readyQuestion.hintTime = theQuestions[currentQuestionIndex].hintTime;
    readyQuestion.timeLimit = theQuestions[currentQuestionIndex].timeLimit;
    readyQuestion.category = theQuestions[currentQuestionIndex].category;
    readyQuestion.imgURL = theQuestions[currentQuestionIndex].imgURL;
    readyQuestion.correctPosition = theQuestions[currentQuestionIndex].order;
    readyQuestion.order= [];
    //readyQuestion = jQuery.extend({}, theQuestions[currentQuestionIndex]);
    //end copying object//

    var readyChoiceHolder = []; //[readyQuestion.choice1, readyQuestion.choice2, readyQuestion.choice3, readyQuestion.choice4];
    correctForStats = getUnique(uniqueNumbers);
    var holdme1 = getUnique(uniqueNumbers);
    var holdme2 = getUnique(uniqueNumbers);
    var holdme3 = getUnique(uniqueNumbers);//thoughts dont think itll work but some thoughts lead to better thoughts

    readyChoiceHolder[correctForStats] = readyQuestion.choice1; //this will tell you position correct answer is located
    readyChoiceHolder[holdme1] = readyQuestion.choice2;
    readyChoiceHolder[holdme2] = readyQuestion.choice3;
    readyChoiceHolder[holdme3] = readyQuestion.choice4;

    readyQuestion.order.push(correctForStats);
    readyQuestion.order.push(holdme1);
    readyQuestion.order.push(holdme2);
    readyQuestion.order.push(holdme3);

    readyQuestion.choice1 = readyChoiceHolder[0];
    readyQuestion.choice2 = readyChoiceHolder[1];
    readyQuestion.choice3 = readyChoiceHolder[2];
    readyQuestion.choice4 = readyChoiceHolder[3];

    readyQuestion.correctPosition = correctForStats;

    // console.log("ready question " + readyQuestion.theQuestion + readyQuestion.choice1 + readyQuestion.choice2 +
    //   readyQuestion.choice3 + readyQuestion.choice4 + " correct position" + correctForStats);
      
    // console.log("theQuestions after " + theQuestions[currentQuestionIndex].theQuestion + theQuestions[currentQuestionIndex].choice1 +
    //   theQuestions[currentQuestionIndex].choice2 + theQuestions[currentQuestionIndex].choice3 + theQuestions[currentQuestionIndex].choice4);
      
    questionSet = true;

  }

  return readyQuestion;
  //return theQuestions[currentQuestionIndex];
}

function recordStats(data) {

  if (data == null) {
    data = {
      'player': "",
      'where': 0
    };
  }

  var obj;

  currentTime = Date.now();

  obj = {
    'question': currentQuestionIndex,
    'player': data.player,
    'choice': data.where,//(1+readyQuestion.order[data.where-1]),//(data.where-1) position choice player made
    'time': currentTime
  };

var z = data.where -1;
  if(z == 0){//soo this maybe works.............................WORKS@@@@@@
    for(var i = 0;i < readyQuestion.order.length; i++){
      if(readyQuestion.order[i] == 0){
        obj.choice = (i+1);
        console.log("player chose position" + z + "whose choice is normaly at position " + i + " in maintenance form.");
      }
    }
  }
  if(z == 1){
      for(var i = 0;i < readyQuestion.order.length; i++){
      if(readyQuestion.order[i] == 1){
        obj.choice = (i+1);
        console.log("player chose position" + z + "whose choice is normaly at position " + i + " in maintenance form.");
      }
    }
  }
  if(z == 2){
      for(var i = 0;i < readyQuestion.order.length; i++){
      if(readyQuestion.order[i] == 2){
        obj.choice = (i+1);
        console.log("player chose position" + z + "whose choice is normaly at position " + i + " in maintenance form.");
      }
    }
  }
  if(z == 3){
      for(var i = 0;i < readyQuestion.order.length; i++){
      if(readyQuestion.order[i] == 3){
        obj.choice = (i+1);
        console.log("player chose position" + z + "whose choice is normaly at position " + i + " in maintenance form.");
      }
    }
  }
  //  console.log("obj: " + JSON.stringify(obj));
  
  console.log(JSON.stringify(obj));

  answers.push(obj);

  // console.log("answers length: " + answers.length);

  if (answers.length > 1000) answers.splice(0, 100);

}

var lastusercount = 1;

//---------------------------------------------- rough file system draft for storing offline data and later retrieving ---------------
//---------------------------------------------- rough file system draft for storing offline data and later retrieving ---------------
var fs = require('fs');
var a = myRead('./log.txt');
var o = JSON.parse(a);
theQuestions = o;

//myWrite('./log.txt',JSON.stringify(theQuestions));

function myRead(filename) {
  return fs.readFileSync(filename, 'utf8');
}

function myWrite(file, data) {
  //console.log("\n\n\nWriting..." + file + "\n\n\n");
  console.log(data + " > " + file);
  fs.writeFile('./log.txt', data, function(err) {
    if (err) { /* Do whatever is appropriate if append fails*/ }
  });
}

//---------------------------------------------- rough file system draft for storing offline data and later retrieving ---------------
//---------------------------------------------- rough file system draft for storing offline data and later retrieving ---------------

var ROOM = {
  'ID': 'open',
  'Name': 'Open Room no limits',
  'PlayerLimit': 15
};

io.set('log level', 2);

router.use(express.static(path.resolve(__dirname, 'client')));

function broadcastMessage(msg, data) {
  //console.log(msg + " --- " + data);
  latestSocket = sockets[0];
  /*global SOCKETS*/
  if (latestSocket) {
    latestSocket.broadcast.emit(msg, data);
    latestSocket.emit(msg, data);
  }
}

function broadcastNewQuestion() {

  gameData.theQuestion = getQuestion();

  latestSocket = sockets[0];

  /*global SOCKETS*/
  if (latestSocket) {

    latestSocket.broadcast.emit("PUZZLE_NEW", gameData);
    latestSocket.emit("PUZZLE_NEW", gameData);

    recordStats();

  }
}

function newPuzzle(data, socket) {

  gameData.theQuestion = getQuestion();

  socket.broadcast.emit("PUZZLE_NEW", gameData);
  socket.emit("PUZZLE_NEW", gameData);
}

function announcePlayerLeft(data, socket) {
  //socket.broadcast.emit("PLAYER_JOINED", data);
  //socket.emit("PLAYER_JOINED", data);   
}

function announcePlayerNew(data, socket) {}

io.on('connection', function(socket) {

  sockets.push(socket);
  socket.team = 1;
  socket.user = lastusercount;
  lastusercount++;

  latestSocket = sockets[0];

  gameData.theQuestion = getQuestion();

  socket.emit("PUZZLE_NEW", gameData);

  socket.on('disconnect', function() {

    var data = socket.username;
    if (data == null) data = "non-logged in user";
    console.log(data + " logged Out");
    announcePlayerLeft(data, socket);
    sockets.splice(sockets.indexOf(socket), 1);

    //if (sockets.length<1) {console.log("answers " + answers);} // if the last player disconnects, store the stats ???

  });

  socket.on('LOGON', function(data) {

    //console.log(JSON.stringify(answers));

    socket.username = data.user;
    socket.join(data.room);
    var theUser = socket.username;
    theUser.room = data.room;
    console.log(socket.username + " logged in");
    socket.emit("ID", theUser);
    announcePlayerNew(theUser, socket);

  });

  socket.on('REMOVE_QUESTION', function(data) {

    removeQuestion(data.index);

    myWrite('./log.txt', JSON.stringify(theQuestions));
    answers=[];

  });

  socket.on('PLAYER_CHOICE', function(data) {

    recordStats(data);

    latestSocket = sockets[0];

    socket.broadcast.emit("CHOICE_PLAYER", data);
    socket.emit("CHOICE_PLAYER", data);

  });



  socket.on('NEW_QUESTION', function(data) {

    var uniqueNumbers = [0, 1, 2, 3];
    var oldLength = theQuestions.length;

    //var ghettoChoice = [data.choice1, data.choice2, data.choice3, data.choice4];//todo
    correctAnswers[data.theIndex] = data.choice1;

    createQuestion(data.theIndex,
      data.theQuestion,
      data.choice1, // ghettoChoice[getUnique(uniqueNumbers)],
      data.choice2, // ghettoChoice[getUnique(uniqueNumbers)],//fix questions so there not pushed into random but are only randomized when emitted to players
      data.choice3, // ghettoChoice[getUnique(uniqueNumbers)],
      data.choice4, // ghettoChoice[getUnique(uniqueNumbers)],
      correctAnswers[data.theIndex], //data.choice1, 
      "hint",
      gameData.defaultHintTime,
      data.qTime,
      'STATISTICS', //category not implemented
      data.imgURL);


    socket.emit("NEW_QUESTION_RESPONSE", {
      'index': data.theIndex,
      'oldLength': oldLength,
      'newLength': theQuestions.length
    });

    socket.emit("MAINTENANCE_SHOW_QUESTIONS", {
      'showIndex': data.theIndex,
      'showQuestion': theQuestions[data.theIndex].theQuestion
    });

    
    myWrite('./log.txt', JSON.stringify(theQuestions));
    answers=[];
    
  });

  socket.on('MAINTENANCE_LOGIN_INFO', function(data) { //todo

    var maintenanceAdminLogin = "kurtz";
    var maintenanceAdminPassword = "brendan";

    var adminusername = data.adminusername;
    var adminpassword = data.adminpassword;
    JSON.stringify(adminusername);
    JSON.stringify(adminpassword);
    if (adminusername == maintenanceAdminLogin) {
      if (adminpassword == maintenanceAdminPassword) {
        //console.log("imadeit");
        socket.emit("VALIDATE_MAINTENANCE_LOGIN", true);
      }
      else {
        socket.emit("VALIDATE_MAINTENANCE_LOGIN", false);
        console.log("bad password");
      }
    }
    else {
      socket.emit("VALIDATE_MAINTENANCE_LOGIN", false);
      console.log("bad username");
    }

  });

  socket.on("MAINTENANCE_OPEN", function(data) {

    console.log("maintenance_open " + data);

    var d = data; // Number(data);

    if (d == -2) { //original connect display questions
      for (var i = 0; i < theQuestions.length; i++) {
        socket.emit("MAINTENANCE_SHOW_QUESTIONS", {
          'showIndex': i,
          'showQuestion': theQuestions[i].theQuestion
        });
      }
    }

    if (d == theQuestions.length || d < 0) {

      d = theQuestions.length;
      socket.emit("CURRENT_MAINTENANCE_INDEX", {
        //'questionsLength': theQuestions.length,
        'index': d
      });
    }
    else if (d > theQuestions.length) {
      console.log("d > " + theQuestions.length);
      d = 0;
      socket.emit("CURRENT_MAINTENANCE_INDEX", {
        'index': d,
        'theQuestion': theQuestions[d].theQuestion,
        'choice1': theQuestions[d].choice1,
        'choice2': theQuestions[d].choice2,
        'choice3': theQuestions[d].choice3,
        'choice4': theQuestions[d].choice4,
        'qTime': theQuestions[d].timeLimit,
        'imgURL': theQuestions[d].imgURL
      });

    }
    else {
      console.log("last else " + d);
      socket.emit("CURRENT_MAINTENANCE_INDEX", {
        'index': d,
        'theQuestion': theQuestions[d].theQuestion,
        'choice1': theQuestions[d].choice1,
        'choice2': theQuestions[d].choice2,
        'choice3': theQuestions[d].choice3,
        'choice4': theQuestions[d].choice4,
        'qTime': theQuestions[d].timeLimit,
        'imgURL': theQuestions[d].imgURL
      });
    }



    //emit questions for reference to view
    socket.emit("")

  });

  socket.on('SET_IMAGE', function(data) {
    images[data.id] = data.src;
    //console.log("images : " + images.length);
    socket.emit('IMAGE_DATA', images[data.id]);
  });

  socket.on('GET_IMAGE', function(data) {
    socket.emit('IMAGE_DATA', images[data]);
  });

  socket.on('PROF_RESET_ANSWERS', function(data) {
    answers = [];
    socket.emit('ANSWERS_PROF', answers);
  });

  socket.on('PROF_GET_ANSWERS', function(data) {
    socket.emit('ANSWERS_PROF', answers);
  });
  
  socket.on('SHOW_STATS_ME', function(data) {
    var id=currentQuestionIndex;
    socket.emit("STATS_SHOW", { 'answers': answers, 'currentID': id } );
  });  
  
  socket.on('SHOW_CORRECT', function(data) {
    var id=currentQuestionIndex;
    broadcastMessage("CORRECT_SHOW", { 'currentID': id } );
  });  

  socket.on('SHOW_STATS', function(data) {
    var id=currentQuestionIndex;
    broadcastMessage("STATS_SHOW", { 'answers': answers, 'currentID': id } );
  });

  socket.on('PROF_GET_QUESTIONS', function(data) {
    socket.emit('QUESTIONS_PROF', theQuestions);
    socket.emit('ANSWERS_PROF', answers);
  });

  socket.on('PROF_NEXT_QUESTION', function(data) {
    lastQuestionTime = 0;
    paused = false;
  });
  
  //PROF_PREVIOUS_QUESITON CALLED FROM PROFESSOR.JS
  socket.on('PROF_PREVIOUS_QUESTION', function(data) {
  //jump to data  (data = number sent from client professor)
  currentQuestionIndex=data;
    questionSet = false;
    //setNextQuestion();
    broadcastNewQuestion();
    lastQuestionTime = Date.now();
  });

  //PROF_PREV_QUESTION CALLED FROM MAINTENANCE.JS
  socket.on('PROF_PREV_QUESTION', function(data) {
    lastQuestionTime = 0;
    currentQuestionIndex -= 2;
    if (currentQuestionIndex < 0) currentQuestionIndex = 0; //.length-1;
    paused = false;
  });

  socket.on('PROF_PAUSE', function(data) {
    paused = true;
  });

  socket.on('PROF_RESUME', function(data) {
    paused = false;
  });

  socket.on('NEW_PUZZLE', function(data) {
    newPuzzle(data, socket);
  });

  socket.emit('USER_GOT', {
    'u': socket.user,
    't': socket.team
  });

});

interval = setInterval(function() {

  var curQ = getQuestion();

  if ((Math.abs(Date.now() - lastQuestionTime) > curQ.timeLimit) && (!(paused))) {
    questionSet = false;
    setNextQuestion();
    broadcastNewQuestion();
    lastQuestionTime = Date.now();
  }

}, 1000);

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("\n\nChat server listening at", addr.address + ":" + addr.port);

});
