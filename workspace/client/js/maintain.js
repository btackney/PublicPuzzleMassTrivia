/*global PIXI*/
/*global io*/
/*global ion*/
/*global $*/

var mysocket = null;

var questionsLength;
var currentIndex;
var currentLength;
var saveShowQuestions = [];

var connectstring = "http://" + window.location.host + ":3000";
if (window.location.host.search("publicpuzzle-pasciaks") > -1) connectstring = ""; // this means if on dev server use blank connection string

var socket = io.connect(connectstring); // io.connect('http://publicpuzzle.com:3000');

$(document).ready(function(){
    
// function resumeBroadcasts() {
//   var data = Date.now();
//   if (mysocket) mysocket.emit("PROF_RESUME", data);
// }

// function pauseBroadcasts() {
//   var data = Date.now();
//   if (mysocket) mysocket.emit("PROF_PAUSE", data);
// }

// function nextQuestion() {
//   var data = Date.now();
//   if (mysocket) mysocket.emit("PROF_NEXT_QUESTION", data);
// }

// $('#prevQuestion').click(function(e) {
//     prevQuestion();
//     e.preventDefault();
//   }
// );

// $('#nextQuestion').click(function(e) {
//     nextQuestion();
//     e.preventDefault();
//   }
// );

// $('#pauseBroadcasts').click(function(e) {
//     pauseBroadcasts();
//     e.preventDefault();
//   }
// );

$('#deleteQuestion').click(function(e) {

    socket.emit("REMOVE_QUESTION", { 'index': currentIndex } );
    currentIndex--;if (currentIndex<0) currentIndex=0;
    socket.emit("MAINTENANCE_OPEN", currentIndex);
    e.preventDefault();
  }
);

// $('#resumeBroadcasts').click(function(e) {
//     resumeBroadcasts();
//     e.preventDefault();
//   }
// );
    
    $("#Login").click(function(){
        //alert("login clicked");
        var adminusername = $("#username").val();
        var adminpassword = $("#password").val();
        validateLogin(adminusername, adminpassword);
    });
    
     $("#newQuestion").click(function(){
         getQuestion();
     });
     $("#prevQ").click(function(){
         socket.emit("MAINTENANCE_OPEN", currentIndex-1);
     });
     $("#nextQ").click(function(){
         socket.emit("MAINTENANCE_OPEN", currentIndex+1);
     });
     $("#jumpQ").click(function(){
         var jumpNum = $("#jumpNumber").val();
         socket.emit("MAINTENANCE_OPEN", jumpNum);
     });
    
});


// function editQuestion(){//todo send edited question to server or new question
//   var Data;
//   if (mysocket) mysocket.emit("PROF_GET_QUESTIONS", data);
// }


function clearForm(){
    $("#question").val("");
    $("#choice1").val("");
    $("#choice2").val("");
    $("#choice3").val("");
    $("#choice4").val("");
    $("#qTime").val("");
    $("#imgURL").val("");
}

function populateForm(data){
    $("#question").val(data.theQuestion);
    $("#choice1").val(data.choice1);
    $("#choice2").val(data.choice2);
    $("#choice3").val(data.choice3);
    $("#choice4").val(data.choice4);
    $("#qTime").val(data.qTime);
    $("#imgURL").val(data.imgURL);
}

function isNumber( input ) {
    return !isNaN( input );
}

function getQuestion(){
    
  var theQuestion = $("#question").val();
  var choice1 = $("#choice1").val();
  var choice2 = $("#choice2").val();
  var choice3 = $("#choice3").val();
  var choice4 = $("#choice4").val();
  
    // if(choice1.substring(0, 4) == 'http'){//make an image outa me
    //     // choice1 = new img(100,100);
    //     // choice1 = choice1 +'.png';
    //     // $("#showMyImage").append(choice1);
    //      var img = $('<img />', {src : choice1 +'.png'});
    //      img.appendTo('body');
    // }  
  
  var qTime = $("#qTime").val();
  var img = $("#imgURL").val();
  
  if(theQuestion == "" || choice1 == "" || qTime == ""){
      alert("must fill out question, choice1, and timer");
      return false;
  }
  if(isNumber(qTime) == false){
      alert("Please input Number"); 
      return false; 
  }
  if(qTime < 1000){
        alert("please enter valid time, must be a number > 999");
        return false;
  }

  sendQuestion(currentIndex, theQuestion, choice1, choice2, choice3, choice4, qTime , img);

}

function sendQuestion(theIndex, theQuestion, choice1, choice2, choice3, choice4, qTime, img){
    console.log("sending question", theQuestion, choice1, choice2, choice3, choice4, qTime);
    
    if (mysocket) socket.emit("NEW_QUESTION",{
        'theIndex': theIndex,
        'theQuestion': theQuestion,
        'choice1': choice1,
        'choice2': choice2,
        'choice3': choice3,
        'choice4': choice4,
        'qTime': qTime,
        'imgURL': img
    });
}

function validateLogin(adminusername, adminpassword){
    console.log(adminusername, adminpassword);
    if (mysocket) socket.emit("MAINTENANCE_LOGIN_INFO", {
            'adminusername': adminusername,
            'adminpassword': adminpassword
        });
}

socket.on('connect', function() {
  
    mysocket = socket;
    
      socket.on("VALIDATE_MAINTENANCE_LOGIN", function(data){
        
        if(data == true){
            $("#maintenanceLogin").hide();//css("display", "none");
            $("#maintenanceForm").show();//css("display", "");

            socket.emit("MAINTENANCE_OPEN", -2);//emit 0 to recognize not querying for specific index info
        } 
        else{
            alert("Bad username or password");
        }
    });
    
    socket.on("CURRENT_MAINTENANCE_INDEX", function(data){
        currentIndex = data.index;
        //alert("main.js in currentmaintenance" + data);
        $("#currentIndex").html("Current Index: " + currentIndex + "<br />");
        populateForm(data);
    });
    
    socket.on("NEW_QUESTION_RESPONSE", function(data){

        currentLength = data.newLength;

        if(data.index == data.oldLength){
            clearForm();
            currentIndex =data.newLength;
        }
        else{
            currentIndex = data.index;
        }
        
        $("#currentIndex").html("Current Index: " + currentIndex + "<br />");
        //showQuestions(data);
    });
    
    socket.on("MAINTENANCE_SHOW_QUESTIONS", function(data){
        var showQuestions = new Object();
        showQuestions.index = data.showIndex;
        showQuestions.theQuestion = data.showQuestion;
         
        if(data.showIndex > -1 && data.showIndex < currentLength){
            saveShowQuestions[data.showIndex] = showQuestions;
            $("#showQuestions").html("");
            //for(var i = 0; i < saveShowQuestions.length; i++){
            //    $("#showQuestions").append("</br>" + saveShowQuestions[i].index + ": ");
            //    $("#showQuestions").append(saveShowQuestions[i].theQuestion);
            //}
        }
        else{
            saveShowQuestions.push(showQuestions);
            //$("#showQuestions").append("</br>" + showQuestions.index + ": ");
            //$("#showQuestions").append(data.showQuestion);
        }
    });

});