/*
	-- game_manager.js --
	Copyright K.MORI
	Ver 1.01
*/


//定数 -- HTML id,class属性値 --
var yiNameAreaIdName = "yi-name";
var yiONameAreaIdName = "yi-oname";
var yiTimerAreaIdName = "yi-current-time";
var yiMyClickAreaIdName = "yi-my-click";
var yiOpClickAreaIdName = "yi-op-click";
var yiCurrentClickCellAreaIdName = "yi-current-click-cell";
var yiNextClickCellAreaIdName = "yi-next-click-cell";
var gridCelTagClassName = "grid-cell";
var gridNumTagClassName = "g-number-text";
var gridNumTagIdCap = "grid-cell-id-";
var countMsgIdName = "div-count-msg";
var bigMsgIdName = "div-big-msg";

//定数 -- 盤面配列 --
var gridCellInfoNameId = "id";
var gridCellInfoNameNum = "num";
var gridCellInfoNameState = "state";
var gridCellInfoStateNormal = "g-state-normal";  //HTML,CSSのclass属性値にも使用しているので注意
var gridCellInfoStateMyClick = "g-state-myclick";//HTML,CSSのclass属性値にも使用しているので注意
var gridCellInfoStateClicked = "g-state-clicked";//HTML,CSSのclass属性値にも使用しているので注意
var gridCellNumString = "";

var finishedGame = false;

//グローバル変数
var gridCellList = new Array();

//ユーザーデータクラス(コンストラクタ)
var myUserData = new UserData();
function UserData(){
	this.id = "1";
	this.name = "";
	this.oname = "";
    this.currentClickNum = 0; //ゲーム開始時は'0'
	this.nextClickNum = 1; //次にクリックする数字
	this.myClickCell = 0;//クリック成功数
	this.opClickCell = 0;//クリック成功数

	//次にクリックする数字の更新関数
	this.updateNextCell = function(){
		this.currentClickNum = this.nextClickNum;
		this.nextClickNum++;
		if(8 < this.nextClickNum){
			this.nextClickNum = 1;
		}
		return;
	};
}

//タイマー設定
var countTimer;
var currentTime = 0;
var currentDisplayTime = 0;
var displayCurrentTime = function(){
	currentTime += 0.1;
	currentDisplayTime = currentTime.toFixed(1);
	displayGameInfo();
	if(currentTime.toFixed(1) == 88.0){
		finishGame();
	}
	return;
};
var countDownTimer;
var crntCntDwnTime = 3;
var displayCntDwnTime = function(){
	if(crntCntDwnTime <= 1){
		clearInterval(countDownTimer);
		$("#" + countMsgIdName).css("visibility","hidden");
		startGame(false);
	}else{
		crntCntDwnTime -= 1;
		$("#" + countMsgIdName).html(crntCntDwnTime);
	}
	return;
};



/*
	-------------------
	-- Program Start --
	-------------------
*/

//読み込み時実行イベント
$(function(){
	
});

//ゲーム情報判断/表示
var displayGameInfo = function(){
	var myClickedCell = 0;
	var opClickedCell = 0;
	$.each($("." + gridCelTagClassName), function(i, elm) {
		if($(elm).hasClass(gridCellInfoStateMyClick)){
			myClickedCell++;
		}else if($(elm).hasClass(gridCellInfoStateClicked)){
			opClickedCell++;
		}
	});
	myUserData.myClickCell = myClickedCell;
	myUserData.opClickCell = opClickedCell;
	$("#" + yiTimerAreaIdName).html(currentDisplayTime);
	$("#" + yiMyClickAreaIdName).html(myUserData.myClickCell);
	$("#" + yiOpClickAreaIdName).html(myUserData.opClickCell);
	$("#" + yiCurrentClickCellAreaIdName).html(myUserData.currentClickNum);
	$("#" + yiNextClickCellAreaIdName).html(myUserData.nextClickNum);
	return;
};

//ゲーム情報設定関数
var settingGame = function(cellNumString, opponentName){
	myUserData.oname = opponentName;
	$("#" + yiONameAreaIdName).html(myUserData.oname);
	gridCellNumString = cellNumString;
	return;
};

//ゲーム情報リセット関数
var resetGame = function(myName){
	myUserData.currentClickNum = 0;
	myUserData.nextClickNum = 1;
	myUserData.totalClickCell = 0;
	clearInterval(countTimer);
	currentTime = 0;
	currentDisplayTime = 0;
	crntCntDwnTime = 3;
	displayGameInfo();
	myUserData.oname = "";
	$("#" + yiONameAreaIdName).html(myUserData.oname);
	myUserData.name = myName;
	$("#" + yiNameAreaIdName).html(myUserData.name);
}

//ゲーム開始処理関数
var startGame = function(flgInit){
	if(flgInit){
		$("#" + bigMsgIdName).css("visibility","hidden");
		$("#btnStartGame").prop("disabled", true);
		//タイマー開始
		$("#" + countMsgIdName).html(crntCntDwnTime);
		$("#" + countMsgIdName).css("visibility","visible");
		countDownTimer = setInterval(displayCntDwnTime, 1000);
	}else{
		//盤面作成
		var gridCellNumArray = new Array();
		for(var i =0; i < 64; i++){
			gridCellNumArray.push(gridCellNumString.substr(i, 1));
		}
		createNewGrid(gridCellNumArray);
		//セル押下イベント登録
		$("." + gridCelTagClassName).click(function(){
		  clickCellEvent($(this).children().attr("id"));
		});
		//タイマー開始
		countTimer = setInterval(displayCurrentTime, 100);
	}
	return;
};

//ゲーム終了処理関数
var finishGame = function(){
	finishedGame = true;
	clearInterval(countTimer);
	var alertMsg = "Game finished.\n";
	//負け
	if(myUserData.myClickCell < myUserData.opClickCell){
		alertMsg += "You lose\n";
	}
	//勝ち
	else if(myUserData.myClickCell > myUserData.opClickCell){
		alertMsg += "You win!\n";
	}
	//引き分け
	else{
		alertMsg += "Game draw\n";
	}
	alertMsg += "Score:" + myUserData.myClickCell + "-" + myUserData.opClickCell;
	alert(alertMsg);
	return;
};

//新しい盤面作成関数
var createNewGrid = function(gridCellNumArray){
	var gridList = $("." + gridCelTagClassName);
	var elmHtml = "";
	gridCellList = new Array();
	var gridCellInfo = new Array();
	//64個の要素に繰り返し処理
	$.each($("." + gridCelTagClassName), function(i, elm) {
		//対象のセル情報作成
		gridCellInfo = new Array();
		gridCellInfo[gridCellInfoNameId] = i;
		gridCellInfo[gridCellInfoNameNum] = gridCellNumArray[i];
		gridCellInfo[gridCellInfoNameState] = gridCellInfoStateNormal;
		//セル情報を盤面配列に格納
		gridCellList.push(gridCellInfo);
		//HTML作成/描画
		elmHtml = "<div id=\"" + gridNumTagIdCap + i + "\" class=\"" + 
					gridNumTagClassName + "\">" + 
					gridCellList[i][gridCellInfoNameNum] + "</div>";
	    $(elm).html(elmHtml);
		$(elm).addClass(gridCellList[i][gridCellInfoNameState]);
	});
	return;
};

//64個のセルに対応する数列作成関数
//true = 文字列で取得, false = 配列で取得
var createNewBoardArray = function(flgGetString){
	var gridCellNumArray = new Array();
	for(var i = 0; i < 64; i++){
		gridCellNumArray.push((i % 8) + 1);
	}
	gridCellNumArray.sort(function() {
	    return Math.random() - Math.random();
	});
	if(!flgGetString){
		return gridCellNumArray;
	}else{
		var retString = "";
		for(var i= 0; i < gridCellNumArray.length; i++){
			retString += gridCellNumArray[i];
		}
		return retString;
	}
};

//セル押下時実行関数
var clickCellEvent = function(gridCellId){
	gridCellId = gridCellId.replace(gridNumTagIdCap, "");
	//セルクリック成功時(クリック済セル以外で次に押すべきセルでゲームが終了していない場合)
	if(gridCellInfoStateMyClick != gridCellList[gridCellId][gridCellInfoNameState]
		&& myUserData.nextClickNum == gridCellList[gridCellId][gridCellInfoNameNum]
		&& !finishedGame){
		//情報/描画内容を更新
		var befClickCellClass = gridCellList[gridCellId][gridCellInfoNameState];
		gridCellList[gridCellId][gridCellInfoNameState] = gridCellInfoStateMyClick;
		myUserData.updateNextCell();
		$.each($("." + gridCelTagClassName), function(i, elm) {
			if(i == gridCellId){
				$(elm).removeClass(befClickCellClass);
				$(elm).addClass(gridCellList[i][gridCellInfoNameState]);
			}
		});
		socket.emit("C_to_S_message", {value: getGameScktMsg("clickCell", gridCellId)});
	}
	return;
};

//セル押下時実行関数(相手方)
var opClickCellEvent = function(gridCellId){
	//情報/描画内容を更新
	var befClickCellClass = gridCellList[gridCellId][gridCellInfoNameState];
	gridCellList[gridCellId][gridCellInfoNameState] = gridCellInfoStateClicked;
	$.each($("." + gridCelTagClassName), function(i, elm) {
		if(i == gridCellId){
			$(elm).removeClass(befClickCellClass);
			$(elm).addClass(gridCellList[i][gridCellInfoNameState]);
		}
	});
	return;
};

//乱数作成関数
//min = 最小数, max = 最大数
var getRandNum = function(min, max){
	var randNum = Math.floor(Math.random() * max);
	return randNum + min;
};

/*
	-------------------
	--  Program End  --
	-------------------
*/




