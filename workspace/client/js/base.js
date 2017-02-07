/*global PIXI*/
/*global io*/
/*global ion*/
/*global $*/

var tl = 0;
var tr = 0;
var bl = 0;
var br = 0;

var correctShowing=false;
var latestCorrectposition = -1;
var lastorder;

var theData = null;

  var timeLeft = 0.0;
  
  var countAll = false ; // counts all answers or not just latest player answers.

var iamlocked = false;

var messageTime = Date.now();
var currentTime = Date.now();
var currrentQuestionID = -1;

var brdr = 10;

var steps = 333;

var allowedToLock = false;

/*global Element*/
function toggleFullScreen() {
  if ((document.fullScreenElement && document.fullScreenElement !== null) || // alternative standard method  
    (!document.mozFullScreen && !document.webkitIsFullScreen)) { // current working methods  
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    }
    else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    }
    else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }
  else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    }
    else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
    else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
}

var imageChoices = ['./img/character/bluefish.png',
  './img/character/pumpkin.png',
  './img/character/africamartian.png',
  './img/character/autumnleaf.png',
  './img/character/bdaycake.png',
  './img/character/butterfly.png',
  './img/character/hotcup.png',
  './img/character/kingcrab.png',
  './img/character/kruhovotar.png',
  './img/character/octopus.png',
  './img/character/pizza.png',
  './img/character/raspberry.png',
  './img/character/Strawberry.png',
  './img/character/turkey.png',
  './img/character/turtle.png',
  './img/character/babyface.png',
  './img/character/flower.png',
  './img/character/girl.png',
  './img/character/guy.png',
  './img/character/hood.png',
  './img/character/star.png'
];

var mysocket = null;
var myColor = pastelColors();
var myImage = "./img/man.png";
var myName = "";
var w;
var h;
var dx = 0;
var dy = 0;

var myRoom = "defaultRoom";

var stage = new PIXI.Container();
stage.interactive = true;
var renderer = new PIXI.WebGLRenderer(window.innerWidth, window.innerHeight);

var connectstring = "http://" + window.location.host + ":3000";
if (window.location.host.search("publicpuzzle-pasciaks") > -1) connectstring = ""; // this means if on dev server use blank connection string

var socket = io.connect(connectstring); // io.connect('http://publicpuzzle.com:3000');

var key_leftarrow = 37;
var key_rightarrow = 39;
var key_downarrow = 40;
var key_uparrow = 38;
var key_c = 67;

var SOUND = 0;

function clickedImageChoice(id) {
  //character image choice
  myImage = imageChoices[id];
  $('#scrolly').fadeOut(500).delay(500).fadeIn(5);
  startGame(0);
}

function buildScrolly() {

  var s = "";

  for (var i = 0; i < imageChoices.length; i++) {
    s += " <img style='width:60;height:60;' src='" + imageChoices[i] + "' id='" + i + "' onclick='clickedImageChoice(" + i + ")'/ > ";
  }

  $('#scrolly').html(s);

}

ion.sound({
  sounds: [{
    name: "snap"
  }, {
    name: "door_bump"
  }, {
    name: "bell_ring"
  }, {
    name: "metal_plate_2"
  }, {
    name: "tada"
  }, {
    name: "gong"
  }, {
    name: "clickoff"
  }, {
    name: "click2"
  }, {
    name: "water_droplet"
  }, ], // main config
  path: "/snd/",
  preload: true,
  multiplay: true,
  volume: 0.4
});

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback, thisArg) {
    var T,
      k;
    if (this == null) {
      throw new TypeError(' this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function');
    }
    if (arguments.length > 1) {
      T = thisArg;
    }
    k = 0;
    while (k < len) {
      var kValue;
      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
}

function countChoices(x, y) {

  var total = 0;

  var names = [];

  stage.children.forEach(function(bunny) {
    if (bunny.type == "player") {
      if (bunny.x == x) {
        if (bunny.y == y) {
          total++;
          names.push(bunny.thename);
        }
      }
    }

  });

  return {
    'total': total,
    'players': names
  };
}

function getProfQuestions() {

  var data = Date.now();
  if (mysocket) mysocket.emit("PROF_GET_QUESTIONS", data);

}

function resumeBroadcasts() {
  var data = Date.now();
  if (mysocket) mysocket.emit("PROF_RESUME", data);
}

function pauseBroadcasts() {
  var data = Date.now();
  if (mysocket) mysocket.emit("PROF_PAUSE", data);
}

function nextQuestion() {
  var data = Date.now();
  if (mysocket) mysocket.emit("PROF_NEXT_QUESTION", data);
}

function playerChoice(id) {

  //playit('snap');
  
  var data = {
    'player': myName,
    'where': id,
    'image': './img/character/' + $("#playerCharacter").val() + '.png' //'./img/man.png' 
  };

  data.image = myImage;

  if (iamlocked) return;

  if (mysocket) mysocket.emit("PLAYER_CHOICE", data);
  
  //if (id>0) if (mysocket) mysocket.emit("SHOW_STATS_ME", 0);
}

function addImageToStage(id, imgURL, x, y, w, h, interactiveOrNot) {
  var texture = PIXI.Texture.fromImage(imgURL);
  var bunny = new PIXI.Sprite(texture);
  bunny.id = id;
  bunny.dirx = 0; //1 - Math.floor(Math.random() * 3); //(0,2);
  bunny.diry = 0; //1 - Math.floor(Math.random() * 3); //(0,2);
  bunny.speedx = 1; //Math.random()*1.5;
  bunny.speedy = 1; //Math.random()*1.25;
  bunny.type = 'image';
  bunny.letter = "";
  bunny.alive = true;
  bunny.width = w;
  bunny.height = h;
  bunny.locked = false;
  bunny.interactive = interactiveOrNot;
  bunny.x = x;
  bunny.y = y;
  bunny.tx = 0;
  bunny.ty = 0;
  bunny.buttonMode = true;
  bunny.blendMode = PIXI.BLEND_MODES.NORMAL;
  bunny.rotation = 0;
  stage.addChild(bunny);
}

function createOrUpdatePlayer(whichPlayerName, choice, playerImage) {

  if (playerImage == null) return;
  if (playerImage == "") return;
  if (playerImage == "./img/man.png") return;
  
  //if (timeLeft/1000<5) return;

  for (var i = 0; i < stage.children.length; i++) {
    if (stage.children[i].thename == whichPlayerName) {

      switch (choice) {
        case 1:
          stage.children[i].tx = 0;
          stage.children[i].ty = 0;
          //console.log(stage.children[i].tx + "," + stage.children[i].ty);
          break;
        case 2:
          stage.children[i].tx = window.innerWidth;
          stage.children[i].ty = 0;
          //console.log(stage.children[i].tx + "," + stage.children[i].ty);
          break;
        case 3:
          stage.children[i].tx = 0;
          stage.children[i].ty = window.innerHeight;
          //console.log(stage.children[i].tx + "," + stage.children[i].ty);
          break;
        case 4:
          stage.children[i].tx = window.innerWidth;
          stage.children[i].ty = window.innerHeight;
          //console.log(stage.children[i].tx + "," + stage.children[i].ty);
          break;
        case 0:
          stage.children[i].tx = window.innerWidth / 2;
          stage.children[i].ty = window.innerHeight / 2;
        default:
          break;
      }
      stage.children[i].dirx = -(stage.children[i].x - stage.children[i].tx) / steps;
      stage.children[i].diry = -(stage.children[i].y - stage.children[i].ty) / steps;

      if (choice == 0) {
        stage.children[i].dirx = 0;
        stage.children[i].diry = 1;
      }

      //addPixiTextPopup(stage.children[i].thename,stage.children[i].x,stage.children[i].y,stage.children[i].dirx,stage.children[i].diry,'red');//,25,200,200,5,5,"RED");//w*2,150,200,50,-5,0,'RED');

      return false;
    }
  }

  var texture = PIXI.Texture.fromImage(playerImage);
  var bunny = new PIXI.Sprite(texture);

  bunny.thename = whichPlayerName;
  bunny.id = whichPlayerName;
  bunny.counter = 0.0;
  bunny.anchor.set(0.5, 0.5);
  bunny.dirx = 0.0; //1-Math.floor(Math.random()*3);//(0,2);
  bunny.diry = 1.0; //1-Math.floor(Math.random()*3);//(0,2);
  bunny.speedx = 1; //Math.random()*1.5;
  bunny.speedy = 1; //Math.random()*1.25;
  bunny.type = 'player';
  bunny.letter = "";
  bunny.alive = true;
  bunny.width = 80;
  bunny.height = 80;
  bunny.locked = false;
  bunny.interactive = false;
  bunny.x = (window.innerWidth / 2) - 100 + Math.random() * 20 * 10;
  bunny.y = 10;//(window.innerHeight / 2) - 100 + Math.random() * 20 * 10;
  bunny.tx = 0; //window.innerWidth/2;
  bunny.ty = window.innerHeight; 
  bunny.buttonMode = true;
  bunny.blendMode = PIXI.BLEND_MODES.NORMAL;
  bunny.rotation = 0.0; //Math.random() * 360;

  stage.addChild(bunny);

  //addPixiTextPopup(....

}

function setIfIsImage(str,field,fac) {
  if (isImage(str)) {
    $('#'+field).html("<img src='" + str + "' width='" + fac + "%' height='" + fac + "%' />");
  }
}

function isImage(str) {
  if (str.length<3) return false;
  var a=str.substr(str.length-3,3);
  //console.log(a);
  a=a.toLowerCase();
  if (a=='png') return true;
  if (a=='jpg') return true;
  return false;
}


function showCorrect(cp) {
  
  if (correctShowing!=false) return;
  
  correctShowing=true;
  
  var spx,spy;
  
  switch (cp) {
    
    case 0:

     for (var i=0;i<99;i++) {
      spx=2-Math.random()*4; if (spx==0.0) spx=1;
      spy=2-Math.random()*4; if (spy==0.0) spy=1;       
      spx*=5;spy*=5;
       addPixiTextPopup("o", 50,50,spx,spy, pastelColors());
       
     }
      break;

    case 1:
     for (var i=0;i<99;i++)  {
      spx=2-Math.random()*4; if (spx==0.0) spx=1;
      spy=2-Math.random()*4; if (spy==0.0) spy=1;
      spx*=5;spy*=5;
       addPixiTextPopup("o", w-50,50,spx,spy, pastelColors());
       
     }
      break;

    case 2:
     for (var i=0;i<99;i++)  {
      spx=2-Math.random()*4; if (spx==0.0) spx=1;
      spy=2-Math.random()*4; if (spy==0.0) spy=1;
      spx*=5;spy*=5;
       addPixiTextPopup("o", 50,h-50,spx,spy, pastelColors());
       
     }
      break;

    case 3:
     for (var i=0;i<99;i++)  {
      spx=2-Math.random()*4; if (spx==0.0) spx=1;
      spy=2-Math.random()*4; if (spy==0.0) spy=1;
      spx*=5;spy*=5;
       addPixiTextPopup("o", w-50,h-50,spx,spy, pastelColors());
       
     }
      break;

    default:
    break;
  }  
  
}

function showQuestion(tq) {
  
  latestCorrectposition = tq.correctPosition;
  
  lastorder=tq.order;
  
  if (tq.imgURL!=="") addImageToStage("localImageBackground",tq.imgURL,10,10,w-20,h-20,false);

      $('#c1').html(tq.choice1);
      $('#c2').html(tq.choice2);
      $('#c3').html(tq.choice3);
      $('#c4').html(tq.choice4);
      
      $('#tq').html(tq.theQuestion);
      
      // if (tq.imgURL != "") {
      //   var j="<img src='XXX' width='100%' height='100%' style='position:absolute;left:0;top:0;right;0;bottom:0;' />";
      //   j=j.replace("XXX",tq.imgURL);
      //   $('#questionImage').html("");
      // }
      
      setIfIsImage(tq.theQuestion,"tq","50"); 
      
      setIfIsImage(tq.choice1,"c1","25");
      setIfIsImage(tq.choice2,"c2","25");
      setIfIsImage(tq.choice3,"c3","25");
      setIfIsImage(tq.choice4,"c4","25");
  
     // showCorrect(latestCorrectposition);

}

function playit(it) {
  if (SOUND) {
    ion.sound.play(it);
  }
}

function generate_user_name() {

  var namesads = ['Slippery', 'Smelly', 'Old', 'Sloppy', 'Happy', 'Happy', 'Happy', 'Lively', 'Angry', 'Muddy', 'Ugly', 'Rich', 'Speedy', 'CrossEyed', 'Happy', 'Thirsty', 'Ms', 'Mister', 'Mistic', 'Vanilla', 'Chocolate', 'Dusty', 'Super', 'Sad', 'Simple', 'Simply', 'Sugar', 'Horny',
    'Hot', 'Hollywood', 'Lucky', 'Deputy', 'King', 'Queen', 'Prince',
    'Princess', 'Nuclear', 'Breezy', 'Sassy', 'White', 'Green', 'Blue',
    'Yellow', 'Golden', 'Bad', 'Good', 'Silver', 'Stormy', 'Tiny', 'New_World',
    'Clumsy', 'Bossy', 'Freaky', 'Twisted', 'Fancy', 'Dancing', 'Dirty',
    'Hairy', 'Hungry', 'Champagne', 'Total', 'Sweet', 'Liquid', 'Temporary',
    'Peppermint', 'Amazing', 'Fat', 'Phat', 'Naked', 'Silent', 'Insane', 'Smooth',
    'Mighty', 'Dangerous', 'Psycho', 'Wild', 'Famous', 'Suicidal', 'Gloomy',
    'Disturbed', 'Wet', 'Wrong', 'Dark', 'Devious', 'Salty', 'Evil', 'Crude',
    'Lazy', 'Lone', 'Sleepy', 'Foolish', 'Bleeding', 'Stealthy', 'Stupid', 'Doctor',
    'Scrawny', 'Slick', 'Little', 'Chubby', 'Thunder', 'Whispering', 'Childish',
    'Bitter', 'Proud', 'Friendly', 'Shy', 'Swift', 'Nervous', 'Rotten', 'Count',
    'Innocent', 'Rude', 'Frosty', 'Captain', 'Rusty', 'Jedi', 'Flying', 'Yuppie',
    'Smokin', 'Eternal', 'Magic', 'Monster', 'Big', 'Lightning', 'Fantastic', 'Global',
    'Blazing', 'Samurai', 'Candy', 'Cute', 'Beautiful', 'Colorful', 'Smart', 'Cowboy',
    'Futuristic', 'Devious', 'Metallic', 'Cool', 'Castaway', 'Modern', 'Homeless',
    'Ancient', 'Nerdy', 'Hippy', 'Brilliant', 'Handsome', 'Florescent', 'Clueless',
    'Southern', 'Communist', 'Tropical', 'Jumping', 'Sexy', 'Rainbow', 'Nice', 'Drooling',
    'Foul', 'Gypsy', 'Platinum', 'Old_School', 'Blonde', 'Street', 'Baby', 'Anonymous',
    'Intergalactic', 'Olympic', 'Real', 'Country', 'Missing', 'Cheating', 'Whiskey',
    'Coach', 'Special', 'Handicapped', 'Dead', 'Vertical', 'Manic', 'Young', 'Wacky', 'Numb',
    'Undercover', 'Cinnamon', 'Omnipotent', 'Peewee', 'Hurricane', 'Original', 'Amber',
    'Doubtful', 'Elite', 'Social', 'Hardcore', 'Solar', 'Atomic', 'Misty', 'Average', 'Black',
    'Heavy', 'Fresh', 'Stale', 'Slimy', 'Spicy', 'Eager', 'Perfect', 'Sir', 'New', 'Soviet', 'Corrupt',
    'Senior', 'First', 'Major', 'Private', 'Rare', 'Red', 'Former', 'Corporate', 'Fake', 'Crazy',
    'Generic', 'Purple', 'Broken', 'Poor', 'Sour', 'Digital', 'Cold', 'Fast', 'Great', 'Polite', 'Hobo',
    'Silly', 'Savage', 'Deaf', 'Dumb', 'Blind', 'Only', 'Single', 'Steel', 'Cyber', 'Max', 'Melted',
    'Ultra', 'Magnetic', 'Useless', 'Unique', 'Klingon', 'Alien', 'Cartoon', 'Gangster',
    'Clever', 'Oak', 'Amish', 'Giant', 'Elf', 'Giddy', 'Outlaw', 'Working', 'Classic',
    'Classy', 'Tiger', 'Iron', 'Limp', 'Sick', 'Bald', 'Wooden', 'Last', 'Northern',
    'Sky', 'Peaceful', 'Voodoo', 'Mad', 'Gay', 'Peppy', 'Raging', 'Foxy', 'Disgrunteled',
    'Noble', 'Terrible', 'Explosive', 'Lovely', 'Pretty', 'War', 'Rowdy', 'Graceful',
    'Strawberry', 'Buffalo', 'Electric', 'Grizzly', 'Witty', 'Political', 'Prime', 'Deep',
    'Soft', 'Pure', 'Secret', 'Chemical', 'Holy', 'Plain', 'Lost', 'Raw', 'Primal', 'Sole',
    'Bare', 'Chronic', 'Hostile', 'Magnetic', 'Shallow', 'Polish', 'Tender', 'Burning',
    'Tragic', 'Resident', 'Goth', 'Romantic', 'Frozen', 'Wicked', 'Weird', 'Busy',
    'Clean', 'Broad', 'Fair', 'Strong', 'Solid', 'Final', 'Altered', 'Basic', 'Proper', 'Minor',
    'Flat', 'Spare', 'Marine', 'Asian', 'American', 'English', 'Mexican', 'Flaming', 'Wireless',
    'The', 'Loyal', 'Rubber', 'Plastic', 'Slim', 'Bloody', 'Normal', 'Crackhead', 'Future', 'Immortal',
    'Violent', 'Unbalanced', 'Covert', 'Tribal', 'Free', 'Common', 'Daily', 'Slow', 'Catholic',
    'Religious', 'Lord', 'Mint', 'Dizzy', 'Exotic', 'Illegal', 'Tricky', 'Used', 'Secondhand',
    'Thrifty', 'Macho', 'Burly', 'Artistic', 'Brave', 'Kid', 'Distant', 'Arctic', 'Bleak',
    'Polar', 'Easy', 'Stiff', 'President', 'Professor', 'Capitalist', 'Chief', 'Phantom',
    'Shadow', 'Royal', 'Space', 'Action', 'Rebel', 'Da', 'Chunky', 'Scarred', 'Sacred',
    'Fickel', 'Sumo', 'Dull', 'Crooked', 'Forgetful', 'Disco', 'Toxic', 'Intoxicating', 'Enchanting', 'Demonic',
    'Heroic', 'Scared', 'Frustrated', 'Frugal', 'Moral', 'Immoral', 'Icy', 'Firey', 'Rocky', 'Explicit', 'Barefoot',
    'Sitting', 'Cloaked', 'Greedy', 'Genius', 'Annoyed', 'Annoying', 'Amused', 'Amusing', 'Frantic', 'Grumpy',
    'Damp', 'Fuzzy', 'Ripe', 'Faithful', 'Damaged', 'Scientific', 'Russian'
  ];

  var namesnons = ['1', '2', '3', '4', '5', '6'];

  for (var i = 7; i < 65536; i++) namesnons.push("" + i);

  var xx = Math.floor(Math.random() * (namesads.length));
  var yy = Math.floor(Math.random() * (namesnons.length));
  if (namesads[xx].substr(0, 4) == namesnons[yy].substr(0, 4)) {
    xx = Math.floor(Math.random() * (namesads.length));
    yy = Math.floor(Math.random() * (namesnons.length));
  }
  if (namesads[xx].substr(0, 4) == namesnons[yy].substr(0, 4)) {
    xx = Math.floor(Math.random() * (namesads.length));
    yy = Math.floor(Math.random() * (namesnons.length));
  }
  if (namesads[xx].substr(0, 4) == namesnons[yy].substr(0, 4)) {
    xx = Math.floor(Math.random() * (namesads.length));
    yy = Math.floor(Math.random() * (namesnons.length));
  }
  return (namesads[xx] + "_" + namesnons[yy]);
}

// window.onkeydown = function(e) {
//   var amt = 60;
//   switch (e.which) {
//     case key_leftarrow:
//       dx = amt;
//       event.preventDefault();
//       break;
//     case key_rightarrow:
//       dx = -amt;
//       event.preventDefault();
//       break;
//     case key_uparrow:
//       dy = amt;
//       event.preventDefault();
//       break;
//     case key_downarrow:
//       dy = -amt;
//       event.preventDefault();
//       break;
//     case key_c:
//       //$('#winscreen').show().delay(5000).fadeOut(500);
//       break;
//   }
//};

function showPlayerChoiceTotals() {

  //  console.log(stage.children.length);

  tl = countChoices(brdr, brdr).total + 0;
  tr = countChoices(w - brdr, brdr).total + 0;
  bl = countChoices(brdr, h - brdr).total + 0;
  br = countChoices(w - brdr, h - brdr).total + 0;

  $('#scoreTL').text(tl);
  $('#scoreTR').text(tr);
  $('#scoreBL').text(bl);
  $('#scoreBR').text(br);

  //  console.log("top left:" + tl);
  //  console.log("top right:" + tr);
  //  console.log("bottom left:" + bl);
  //  console.log("bottom right:" + br);

  //  console.log("top left:" + countChoices(brdr, brdr).players);
  //  console.log("top right:" + countChoices(w - brdr, brdr).players);
  //  console.log("bottom left:" + countChoices(brdr, h - brdr).players);
  //  console.log("bottom right:" + countChoices(w - brdr, h - brdr).players);

}



function resizeRelocateButtons() {


  var factor = 2;

  $('#choice1').css('width', w / factor);
  $('#choice2').css('width', w / factor);
  $('#choice3').css('width', w / factor);
  $('#choice4').css('width', w / factor);
  $('#choice1').css('height', h / factor);
  $('#choice2').css('height', h / factor);
  $('#choice3').css('height', h / factor);
  $('#choice4').css('height', h / factor);

  $('#c1').css('width', w / factor);
  $('#c2').css('width', w / factor);
  $('#c3').css('width', w / factor);
  $('#c4').css('width', w / factor);
  // $('#c1').css('height', h / factor);
  // $('#c2').css('height', h / factor);
  // $('#c3').css('height', h / factor);
  // $('#c4').css('height', h / factor);  

}

function resizewin() {
  w = window.innerWidth;
  h = window.innerHeight;
  renderer.view.style.width = w + "px";
  renderer.view.style.height = h + "px";
  renderer.resize(w, h);
  resizeQuestionImage();
  resizeRelocateButtons();
  $('#timer').css('left', w / 2 - 100);
}

function pastelColors() {
  ////'#'+Math.floor(Math.random()*16777215).toString(16);
  var r = (Math.round(Math.random() * 127) + 127).toString(16);
  var g = (Math.round(Math.random() * 127) + 127).toString(16);
  var b = (Math.round(Math.random() * 127) + 127).toString(16);
  return '#' + r + g + b;
}

function moveEverything(cx, cy) {
  stage.children.forEach(function(bunny) {
    if (!bunny.locked) {
      if (bunny.alive) {
        bunny.x += cx;
        bunny.y += cy;
      }
    }
  });
}

function animateEverything() {
  
  currentTime = Date.now();

  var timeElapsed = currentTime - messageTime;
  
  timeLeft = theData.timeLimit * 1.0 - timeElapsed * 1.0;
  
  if (!correctShowing) {
    if (timeLeft/1000<5) {
      showCorrect(latestCorrectposition);
    }
  }

  if (timeLeft >= 0) $('#timer').text((timeLeft / 1000).toFixed(0));

  if (timeLeft < 0) {
    $('#timer').hide();
  }
  else {
    $('#timer').show();
  }

  stage.children.forEach(function(bunny) {
    if (!bunny.locked) {
      if (bunny.alive) {
        bunny.x += bunny.dirx;
        bunny.y += bunny.diry;
      }
    }
  });
}

function movePlayers() {

  stage.children.forEach(function(bunny) {

    if (bunny.type == 'animation') {
      bunny.x += bunny.dirx ;//+ 2-Math.random()*4;
      bunny.y += bunny.diry ;//+ 2-Math.random()*4;
    }

    if (bunny.type == 'player') {
      bunny.rotation += Math.random()/10;
    }

    if (!bunny.locked) {

      if (bunny.type == 'player') {

        bunny.counter += .05 + Math.random() / 10;
        bunny.width = 40 + Math.sin(bunny.counter) * 5;
        bunny.height = 40 + Math.cos(bunny.counter) * 5;
        bunny.x += bunny.dirx * bunny.speedx;
        bunny.y += bunny.diry * bunny.speedy;

        if (bunny.x < brdr) bunny.x = brdr;
        if (bunny.x > window.innerWidth - brdr) bunny.x = w - brdr;
        if (bunny.y < brdr) bunny.y = brdr;
        if (bunny.y > window.innerHeight - brdr) bunny.y = h - brdr;

        if (allowedToLock) { //allow locked in place
          if (bunny.x == brdr)
            if (bunny.y == brdr) bunny.locked = true;

          if (bunny.x == brdr)
            if (bunny.y == window.innerHeight - brdr) bunny.locked = true;

          if (bunny.x == window.innerWidth - brdr)
            if (bunny.y == brdr) bunny.locked = true;

          if (bunny.x == window.innerWidth - brdr)
            if (bunny.y == window.innerHeight - brdr) bunny.locked = true;
        }

        if (bunny.locked) {
          if (bunny.id == myName) iamlocked = true;
          showPlayerChoiceTotals();
        }

      }

    }
  });
}

function resizeQuestionImage() {

  for (var i = stage.children.length - 1; i >= 0; i--) {
    if (stage.children[i].type == 'image') {
      stage.children[i].x = 0; //w/8;
      stage.children[i].y = 0; //h/8;
      stage.children[i].width = w; //-w/4;
      stage.children[i].height = h; //-h/4;
    }
  }
}

function emptyStage() {
  for (var i = stage.children.length - 1; i >= 0; i--) {
    stage.removeChild(stage.children[i]);
  }
}

function addPixiTextPopup(message, x, y, dirx, diry, cc) {

  if (message == "") return;

  var style = {
    fontFamily: 'COURIER',
    fontSize: '128pt',
    fill: cc,
    stroke: pastelColors(),
    strokeThickness: 1,
    dropShadow: false,
    dropShadowColor: '#222333',
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: false,
    wordWrapWidth: 440
  };
  

  var bunny = new PIXI.Text(message, style);
  bunny.x = x;
  bunny.y = y;
  bunny.type = 'animation';
  bunny.dirx = dirx ;
  bunny.diry = diry ;
  stage.addChild(bunny);
  

}

function addPixiText(message, x, y, wi, hi, cc) {

  if (message == "") return;
  if (message == null) return;

  var style = {
    fontFamily: 'Verdana',
    fontSize: '96pt',
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: '#F7EDCA',
    stroke: '#4a1850',
    strokeThickness: 2,
    dropShadow: true,
    dropShadowColor: '#222333',
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440
  };

  var bunny = new PIXI.Text(message, style);
  bunny.width = wi;
  bunny.height = hi;
  bunny.x = x;
  bunny.y = y;

  stage.addChild(bunny);
}

function computeStats(arr,qid) {
  
  var obj;

  var totals=[];
  
  var uniquePlayerNames=[];
  
  // for (var j=0;j<arr.length;j++) {
  //   if (uniquePlayerNames.indexOf(arr[j].player)>-1) {
  //     // player already noted
  //   } else {
  //     // first time player noted
  //     uniquePlayerNames.push(arr[j].player);
  //   }
  // }
  // alert(JSON.stringify(uniquePlayerNames));
  
    for (var j=1;j<=4;j++) {
      totals[j]=0;
    }
  
  //walk through all answers reversed
    for (var i=arr.length-1;i>=0;i--) {
      
    obj=arr[i];
      //only total answers for selected question id
      if (obj.question==qid) {
        //new question creates an answer with player==""
        if (obj.player!=="") {
          //only record latest answer for player
            if ((countAll==true) || (uniquePlayerNames.indexOf(obj.player)<0)) {
              totals[obj.choice]++;
              uniquePlayerNames.push(obj.player);
              //console.log(obj.player);
            }
        }
      }
      
    }
  
  var ss=lastorder + " <BR />" ;//+ "Correct:" + (1+latestCorrectposition) + "<br />";
  for (var j=1;j<=4;j++) {
    for (i=1;i<=4;i++) {
      //"Q#:" + qid + "  (" + (1+lastorder[i-1]) + ")"
      if ((1+lastorder[i-1])==j) {
        totals[i]+=0;
        ss+=totals[i] + "<br />";
        if (j==1) {addPixiTextPopup(totals[i]+"", 100,25,-.1,0, 'black');}
        if (j==2) {addPixiTextPopup(totals[i]+"", w-100,25,.1,0, 'black');}
        if (j==3) {addPixiTextPopup(totals[i]+"", 100,h-50,-.1,0, 'black');}
        if (j==4) {addPixiTextPopup(totals[i]+"", w-100,h-50,.1,0, 'black');}
      }
    }
  }
  $('#data').html(ss);
  
}

function animate() {

  requestAnimationFrame(animate);

  renderer.render(stage);

  movePlayers();

  moveEverything(dx, dy); // if dx or dy are anything, the entire stage and all objects move that much

  dx = 0;
  dy = 0; // once moved, reset the dx and dy so they stop 

  animateEverything();

}

//todo pick a place for init type code like this
$(resizewin());

buildScrolly();

var username = generate_user_name();

$('#username').val(username);
$('#username').focus();
$('#username').css("background-color", myColor);

function startGame(option) {

  //$('#overlay').fadeIn(500).delay(3000).fadeOut(500);

  socket.emit("LOGON", {
    'user': $('#username').val(),
    'room': myRoom
  });

  $('#logonscreen').fadeOut(1000);

  toggleFullScreen();  //todo: if ismobile then full screen this player

  document.body.appendChild(renderer.view);

  SOUND = option;
  playit("gong");
}

$('#nextQuestion').click(function(e) {
  nextQuestion();
  e.preventDefault();
});

$('#pauseBroadcasts').click(function(e) {
  pauseBroadcasts();
  e.preventDefault();
});

$('#resumeBroadcasts').click(function(e) {
  resumeBroadcasts();
  e.preventDefault();
});

$('#choice1').click(function(e) {
  playerChoice(1);
  e.preventDefault();
});

$('#choice2').click(function(e) {
  playerChoice(2);
  e.preventDefault();
});

$('#choice3').click(function(e) {
  playerChoice(3);
  e.preventDefault();
});

$('#choice4').click(function(e) {
  playerChoice(4);
  e.preventDefault();
});

$('#logonbut').click(function(e) {
  startGame(1);
  e.preventDefault();
});

$('#logonbutquiet').click(function(e) {
  startGame(0);
  e.preventDefault();
});

$('#randomnick').click(function(e) {
  username = generate_user_name();
  $('#username').val(username);
  e.preventDefault();
});

document.addEventListener('contextmenu', function(evt) {
  evt.preventDefault();
}, false);

socket.on('connect', function() {

    mysocket = socket;

    socket.on('CHOICE_PLAYER', function(data) {
      //  console.log(data);

      createOrUpdatePlayer(data.player, data.where, data.image);
    });

    socket.on('USER_GOT', function(u) {
      //connection established
      $('#logonscreen').fadeIn(0);
    });

    socket.on("ID", function(d) {
      myName = d;
      playerChoice(0);
    });
    
    socket.on('CORRECT_SHOW', function(data) {
      correctShowing=false;
      showCorrect(latestCorrectposition);
    });    

    socket.on('STATS_SHOW', function(data) {
      
      var answers=data.answers;
      
      //todo do this processing at server and modify this client receive
      //to get only the essential data ( #,#,#,# for totals, instead of entire !@#$! Array! -slp)
      
      computeStats(answers,data.currentID);
      
      //$('#overlay').fadeIn(50).delay(1000).fadeOut(50); /// <<-- replaced by pixitextpopups
      
    });

    socket.on('PLAYER_JOINED', function(data) {
      //  console.log(data);
    });

    socket.on('PLAYER_LEFT', function(data) {
      // console.log(data);
    });

    socket.on('QUESTIONS_PROF', function(data) {
      // console.log(data.array);
    });

    socket.on('PUZZLE_NEW', function(data) {
      messageTime = Date.now();
      theData = data.theQuestion;
      correctShowing=false;
      latestCorrectposition=data.theQuestion.correctPosition;
      emptyStage();
      iamlocked = false;
      playerChoice(0);
      showPlayerChoiceTotals();
      //console.log(data.theQuestion);
      showQuestion(data.theQuestion);
      $(resizewin());
      
    });

    window.addEventListener('resize', resizewin, false);
    requestAnimationFrame(animate);
  }



);
