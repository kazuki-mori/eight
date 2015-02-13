var http = require("http");
var socketio = require("socket.io");
var fs = require("fs");
var url = require('url');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');

var app = express();
var BSON = mongodb.BSONPure;
var db;
var users;
var boards;
var server;

app.use(express.static('front'));
app.use(bodyParser.json());

app.get('/', function(req, res){
   fs.readFile("./index.html", function(error, content) {
       if ( error ) {
           res.writeHead(500);
           res.end();
       } else {
           res.writeHead(200, {'Content-Type': 'text/html'});
           res.end(content, 'utf-8');
       }
   });
});

app.get(/^\/(?:css|js|img|fonts)\/.+/, function(req, res) {
    var contentType = undefined
      , filePath = __dirname + req.url;
	var requestFileNameArray = req.url.split("?");
	var requestFileName = requestFileNameArray[0];
    switch( path.extname(requestFileName) ) {
    case '.css':
        contentType = 'text/css';
        break;
    case '.js':
        contentType = 'text/javascript';
        break;
    case '.ttf':
        contentType = 'application/x-font-ttf';
        break;
    case '.png':
        contentType = 'image/png';
        break;
    default:
        contentType = 'text/html';
    }

	if(contentType != 'image/png'){
            fs.readFile(filePath, function(error, content) {
                if ( error ) {
                    res.writeHead(500);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': contentType});
                    res.end(content, 'utf-8');
                }
            });
	}else{
		res.writeHead(200, {"Content-Type":"image/png"});
		requestFileNameArray = filePath.split("?");
		requestFileName = requestFileNameArray[0];
    	var output = fs.readFileSync(requestFileName);
		res.end(output);
	}

});


server = http.createServer(app);


/*
	socket関連
*/
var io = socketio.listen(server);

io.sockets.on("connection", function (socket) {

  // メッセージ送信（送信者にも送られる）
  socket.on("C_to_S_message", function (data) {
	console.log(data.value);
    io.sockets.emit("S_to_C_message", {value:data.value});
  });

  // ブロードキャスト（送信者以外の全員に送信）
  socket.on("C_to_S_broadcast", function (data) {
    socket.broadcast.emit("S_to_C_message", {value:data.value});
  });

  // 切断したときに送信
  socket.on("disconnect", function () {
//    io.sockets.emit("S_to_C_message", {value:"user disconnected"});
  });
});


/*
	mongodb関連
*/
var mongoDBUriString = "mongodb://localhost:27017/eightdb";
mongodb.MongoClient.connect(mongoDBUriString, function(err, database) {
     if (err) {
     	console.log ("ERROR mongodb connecting to: " + mongoDBUriString + ". " + err);
     } else {
        console.log ("SUCCESS mongodb connected to: " + mongoDBUriString);
		db = database;
		users = db.collection("users");
		boards = db.collection("boards");
		//dbに接続完了の後、サーバーリッスン開始
		server.listen(process.env.PORT || 3000, function(){});
		console.log("server start");
	}
});

// 一覧取得(ユーザー)
app.get("/api/users", function(req, res) {
  users.find().toArray(function(err, items) {
    res.send(items);
  });
});

// 追加(ユーザー)
app.post("/api/users", function(req, res) {
  var user = req.body;
  users.insert(user, function() {
	var resItem = "insert";
    res.send(resItem);
  });
});

// 削除(ユーザー)
app.delete("/api/users/:_id", function(req, res) {
  console.log("user_delete:" + req.params._id);
  users.remove({"name": req.params._id}, function() {
	var resItem = "delete";
    res.send(resItem);
  });
});




// 追加(ゲーム)
app.post("/api/game", function(req, res) {
  var board = req.body;
  boards.insert(board, function(err, result) {
	var resItem = "insert";
    res.send(resItem);
  });
});



