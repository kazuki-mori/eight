/*
	-- game_manager.js --
	Copyright K.MORI
	Ver 1.01
*/


//定数
var myName = "";
var opponentName = "";
var boardCreateAt = "";

//定数 -- HTML id,class属性値 --
var bigMsgIdName = "div-big-msg";



/*
	-------------------
	-- Program Start --
	-------------------
*/
//angularModuleの作成
var app = angular.module('app', ['ngResource', 'ngRoute']);

//angularによるルーティング設定
app.config(function($routeProvider) {
    $routeProvider.when('/users', {
        templateUrl: 'roomlist.html', controller: 'RoomListCtrl'
    }).when('/users/:_id', {
        templateUrl: 'roomlist.html', controller: 'RoomListCtrl'
    }).when('/game/:_id', {
        templateUrl: 'gameboard.html', controller: 'GameCtrl'
    }).otherwise({
        redirectTo: '/users'
    });
    });

//app.jsで定義したREST APIを使うためのサービス'User','Board'を定義
app.factory("User", function($resource) {
    return $resource("/api/users/:_id", {_id: "@_id"});
});
app.factory("Board", function($resource) {
    return $resource("/api/game/:_id", {_id: "@_id"});
});

//ルーム一覧コントローラー
app.controller("RoomListCtrl", function($scope, $route, $location, User) {
	resetGame(myName);
    $scope.users = User.query();
	$scope.user_name = myName;
	//ゲームを終えてルームリストの画面に来た場合
	if("" != myName){
		//自分のユーザーデータ削除
		User.delete({_id: myName}, function() { });
	}
	// 新規ルーム作成関数
	$scope.ngCreateRoom = function() {
		var newUser = new User;
		newUser.name = $scope.user_name;
		// 名前が入力されているかチェック
		try{
			myName = $scope.user_name;
		}catch(e){
			alert("Please input a user name");
			return false;
		}
		if("" == myName){
			alert("Please input a user name");
			return false;
		}
		// start 同じ名前がいないかチェック
		var boolSameUser = false;
		var curUsers = $scope.users;
		for(var i = 0; i < curUsers.length; i++){
			if(curUsers[i].name == newUser.name){
				boolSameUser = true;
			}
		}
		if(boolSameUser){
			alert("There is a user of the same name already");
			return false;
		}
		// end 同じ名前がいないかチェック

		newUser.state = "1";
		newUser.roomer = "1";
    	User.save(newUser, function(data) { });
		$scope.users = User.query();
		$scope.$apply();
		$location.url('/game/owner');
		socket.emit("C_to_S_message", {value:"changeRoom#owner"});
    };
	// ルーム入室関数
	$scope.ngEnterRoom = function(_roomid, _ownername) {
		// 名前が入力されているかチェック
		try{
			myName = $scope.user_name;
		}catch(e){
			alert("Please input a user name");
			return false;
		}
		if("" == myName){
			alert("Please input a user name");
			return false;
		}
		opponentName = _ownername;
		var newUser = new User;
		newUser.name = $scope.user_name;
		newUser.state = "2";
		newUser.roomer = "0";
    	User.save(newUser, function() {	});
		var roomUser = new User;
		roomUser._id = _roomid;
		roomUser.name = _ownername;
		roomUser.state = "2";
		roomUser.roomer = "1";
    	User.save(roomUser, function() { });
		$scope.users = User.query();
		$scope.$apply();
		$location.url('/game/enter');
		socket.emit("C_to_S_message", {value:"changeRoom#enter"});
    };
	$scope.updateScreen = function() {
		$scope.users = User.query();
		$scope.$apply();
	};
});

//ゲーム画面コントローラー
app.controller("GameCtrl", function($scope, $routeParams, $location, Board) {
	//ゲーム画面リフレッシュ
	$scope.my_name = myName;
	resetGame(myName);
	// ルームに来客者が入室した場合
	if($routeParams._id == "enter"){
		$("#" + bigMsgIdName).html("Please wait room owner to press a 'GAME START'");
		$("#btnStartGame").css("visibility","hidden");
		// ゲーム開始処理
		var cellNumString = createNewBoardArray(true);
		var currentDate = new Date();
		boardCreateAt = currentDate.getTime(); 
		/*
		// ゲーム(board)情報のDB保存処理
		var newBoard = new Board;
		newBoard.owner = opponentName;
		newBoard.enter = myName;
		newBoard.createat = boardCreateAt;
		newBoard.boardinfo = cellNumString;
		newBoard.boardstate = "0000000000000000000000000000000000000000000000000000000000000000";
		Board.save(newBoard, function() { });
		*/
		socket.emit("C_to_S_message", {value: getGameScktMsg("opponentName", myName)});
		socket.emit("C_to_S_message", {value: getGameScktMsg("boardCreateAt", boardCreateAt)});
		socket.emit("C_to_S_message", {value: getGameScktMsg("cellNumString", cellNumString)});
		settingGame(cellNumString, opponentName);
	}
	// ルームに管理者(owner)が入室した場合
	if($routeParams._id == "owner"){
		$("#" + bigMsgIdName).html("Please wait for a guest");
	}
});

// socketによるゲームのやりとりメッセージ作成関数
var getGameScktMsg = function(type, msg){
	var scktMsg = "gameInfo#";
	scktMsg += opponentName + "$";
	scktMsg += type + "%";
	scktMsg += msg;
	return scktMsg;
};

//GAME STARTボタンクリック関数
var clickStartGame = function(){
	socket.emit("C_to_S_message", {value: getGameScktMsg("gameStartSign", "gameStart")});
	startGame(true);
	return;
};

var socket = io.connect(); //リモート接続
//サーバから受け取るイベント
socket.on("connect", function () {});  // 接続時
socket.on("disconnect", function (client) {});  // 切断時
socket.on("S_to_C_message", function (data) {
	var dataArray = data.value.split("#");
	var dataType = dataArray[0];
	var dataVal = dataArray[1];
	//ユーザー(ルーム)変更通知の場合
	if("changeRoom" == dataType){
        var roomCtrlScope = angular.element(divNgScreenCtrl).scope();
		roomCtrlScope.updateScreen();
	}
	//ゲームのやりとり通知の場合
	else if("gameInfo" == dataType){
		var dataDetailArray = dataVal.split("$");
		var toUserName = dataDetailArray[0];
		var msgArray = dataDetailArray[1];
		//やりとりの相手が自分の場合のみ処理をする
		if(myName == toUserName){
			dataDetailArray = msgArray.split("%");
			var msgType = dataDetailArray[0];
			var gameMsg = dataDetailArray[1];
			//来客者が来た場合
			if("opponentName" == msgType){
				$("#" + bigMsgIdName).css("visibility","hidden");
				opponentName = gameMsg;
				alert("'" + opponentName + "' entered a room");
				$("#btnStartGame").prop("disabled", false);
			}
			//ゲーム開始に必要な情報の場合
			else if("boardCreateAt" == msgType){
				boardCreateAt = boardCreateAt;
			}
			//盤面(board)情報の場合
			else if("cellNumString" == msgType){
				settingGame(gameMsg, opponentName);
			}
			//ゲーム開始信号の場合
			else if("gameStartSign" == msgType){
				startGame(true);
			}
			//相手によるセルクリック通知の場合
			else if("clickCell" == msgType){
				opClickCellEvent(gameMsg);
			}
		}
	}
});

/*
	-------------------
	--  Program End  --
	-------------------
*/




