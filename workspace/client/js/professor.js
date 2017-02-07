/*global PIXI*/
/*global io*/
/*global $*/

var mysocket = null;

var connectstring = "http://" + window.location.host + ":3000";
if (window.location.host.search("publicpuzzle-pasciaks") > -1) connectstring = ""; // this means if on dev server use blank connection string

var socket = io.connect(connectstring); // io.connect('http://publicpuzzle.com:3000');

$(document).ready(function(){
    
function showStats() {
  var data = Date.now();
  console.log("SHOW_STATS");
  if (mysocket) mysocket.emit("SHOW_STATS", data);
}  

function showCorrectAnswer() {
  var data = Date.now();
  console.log("SHOW_CORRECT");
  if (mysocket) mysocket.emit("SHOW_CORRECT", data);
}

function previousQuestion() {
  var data = 0;
  if (mysocket) mysocket.emit("PROF_PREVIOUS_QUESTION", data);

}
    
function pauseBroadcasts() {
  var data = Date.now();
  if (mysocket) mysocket.emit("PROF_PAUSE", data);
}

function nextQuestion() {
  var data = Date.now();
  if (mysocket) mysocket.emit("PROF_NEXT_QUESTION", data);
}

$('#previousQuestion').click(function(e) {
    previousQuestion();
    e.preventDefault();
  }
);

$('#showCorrectAnswer').click(function(e) {
    showCorrectAnswer();
    e.preventDefault();
  }
);

$('#nextQuestion').click(function(e) {
    nextQuestion();
    e.preventDefault();
  }
);

$('#pauseBroadcasts').click(function(e) {
    pauseBroadcasts();
    e.preventDefault();
  }
);

$('#showStats').click(function(e) {
    showStats();
    e.preventDefault();
  }
);

    $("#Login").click(function(){
        //alert("login clicked");
        var adminusername = $("#username").val();
        var adminpassword = $("#password").val();
        validateLogin(adminusername, adminpassword);
    });
    
});

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
            $("#maintenanceLogin").hide();
            $("#maintenanceForm").show();
            socket.emit("MAINTENANCE_OPEN", -2);
        } 
        else{
              alert("Bad username or password");
        }
    });

});










