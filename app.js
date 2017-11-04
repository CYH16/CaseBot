var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "381ddbed-8120-4d12-b565-d39e21004bd2",
    appPassword: "cfVhYKuirOgUT7ovt9L0tYo"
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Get data
const Data = JSON.parse(require('fs').readFileSync('./case_data_B.json', 'utf8'));
const Blood = JSON.parse(require('fs').readFileSync('./B_blood.json', 'utf8'));
const Urine = JSON.parse(require('fs').readFileSync('./B_urine.json', 'utf8'));
const Image = JSON.parse(require('fs').readFileSync('./B_image.json', 'utf8'));

var bot = new builder.UniversalBot(connector, [
	function (session) {
		var go = ['1','2','3','4','隨機幫我挑吧'];
		var message = new builder.Message(session).text("嗨你好，你想要練習哪一個case呢？").suggestedActions(
			builder.SuggestedActions.create(
				session, go.map(choice => new builder.CardAction.imBack(session, choice, choice))
			)
		);
        builder.Prompts.text(session, message);
	},
	function (session, results){
		if (["1","2","3","4"].indexOf(results.response) >= 0) {
			session.send("好的，開始囉~");
			i = parseInt(results.response)-1;
			Case = Data[i];
			session.replaceDialog("scene");
		} else if (results.response == "隨機幫我挑吧") {
			session.send("好的，幫你隨機挑喔~");
			i = Math.floor(Math.random()*Data.length);
			Case = Data[i];
			session.replaceDialog("scene");
		} else {
			session.send("Sorry~我們現在只能夠隨機挑，先幫你隨機挑喔><")
			i = Math.floor(Math.random()*Data.length);
			Case = Data[i];
			session.replaceDialog("scene");
		}
	}
]);

bot.dialog('scene', [
    function (session) {
		var go = ['問診'];
		var message = new builder.Message(session).text(Case["scene"]).suggestedActions(
			builder.SuggestedActions.create(
				session, go.map(choice => new builder.CardAction.imBack(session, choice, choice))
			)
		);
        builder.Prompts.text(session, message);
    },
	function (session, results){
		if (results.response == "問診") {
			session.replaceDialog("inquiry");
		} else {
			session.send("接下來應該要先問診喔><")
			session.replaceDialog("inquiry");
		}
	}
]);

bot.dialog('inquiry', [
    function (session) {
		if (Array.isArray(Case["inquiry"])) {
			var go = ['理學檢查'];
			var message = new builder.Message().setText(session, Case["inquiry"][0]).addAttachment({contentType:'image/jpeg', contentUrl:Case["inquiry"][1]}).suggestedActions(
				builder.SuggestedActions.create(
					session, go.map(choice => new builder.CardAction.imBack(session, choice, choice))
				)
			);
			builder.Prompts.text(session, message);
		} else {
			var go = ['理學檢查'];
			var message = new builder.Message(session).text(Case["inqury"]).suggestedActions(
				builder.SuggestedActions.create(
					session, go.map(choice => new builder.CardAction.imBack(session, choice, choice))
				)
			);
			builder.Prompts.text(session, message);
		}    
	},
	function (session, results){
		if (results.response == "理學檢查") {
			session.replaceDialog("PE");
		} else {
			session.send("接下來應該要做理學檢查喔><")
			session.replaceDialog("PE");
		}
	}
]);

bot.dialog('PE', [
    function (session) {
		if (Array.isArray(Case["PE"])) {
			if (Case["PE"][1] == "圖") {
				var reply = new builder.Message().setText(session, Case["PE"][0]).addAttachment({contentType:'image/jpeg', contentUrl:Case["PE"][2]});
				session.send(reply);
				session.replaceDialog('tools');
			} else if (Case["PE"][1] == "音") {
				var reply = new builder.Message().setText(session, Case["PE"][0]).addAttachment({contentType:'audio', contentUrl:Case["PE"][2]});
				session.send(reply);
				session.replaceDialog('tools');				
			} else if (Case["PE"][1] == "圖+音") {
				var reply = new builder.Message().setText(session, Case["PE"][0]).addAttachment({contentType:'image/jpeg', contentUrl:Case["PE"][2]}).addAttachment({contentType:'audio', contentUrl:Case["PE"][3]});
				session.send(reply);
				session.replaceDialog('tools');				
			}
		} else {
			session.send("%s", Case["PE"]);
			session.replaceDialog('tools');
		}    
	}
]);

bot.dialog('tools', [
    function (session) {
		var tools = ["抽血","尿液檢查","影像學","其他"];
		tools.push("我要診斷");
		var message = new builder.Message(session).text("接下來你想做什麼呢？").suggestedActions(
			builder.SuggestedActions.create(
				session, tools.map(choice => new builder.CardAction.imBack(session, choice, choice))
			)
		);
		builder.Prompts.text(session, message);
		},
	function (session, results){
		if (results.response == "我要診斷" || results.response == "下診斷" || results.response == "診斷" || results.response == "我要下診斷") {
			session.replaceDialog("diagnosis");
		} else if (results.response == "抽血") {
			session.replaceDialog("blood");
		} else if (results.response == "尿液檢查") {
			session.replaceDialog("urine");
		} else if (results.response == "影像學") {
			session.replaceDialog("image");
		} else if (results.response == "其他") {
			session.replaceDialog("other");
		} else {
			session.send("請選擇我們現在有的工具喔~");
			session.replaceDialog("tools");
		}
	}
]);

bot.dialog('blood', [
    function (session) {
		var message = new builder.Message(session).text("以下是常用的項目，請問要抽哪些呢？例如如果你想抽CBC和CRP，就打\"AW\"或是\"aw\"。").addAttachment({contentType:'image/jpeg', contentUrl:"https://i.imgur.com/tlnPlsj.png"});
		builder.Prompts.text(session, message);
		},
	function (session, results){
		var order = results.response.toUpperCase();
		var otherTest = false;
		for (var i = 0, len = order.length; i < len; i++) {
			if (order[i] == "?" || order[i] == "？") {
				otherTest = true;
			} else if (order[i] in Case["tools"]["blood"]) {
				if (Array.isArray(Case["tools"]["blood"][results.response])) {
					var reply = new builder.Message().setText(session, Case["tools"]["blood"][order[i]][0]).addAttachment({contentType:'image/jpeg', contentUrl:Case["tools"]["blood"][order[i]][1]});
					session.send(reply);
				} else {
					session.send("%s：%s", Blood[order[i]],Case["tools"]["blood"][order[i]]);
				}
			} else if (order[i] in Blood) {
				session.send("%s：沒有特別發現or目前不需要", Blood[order[i]]);
			}
		}
		if (otherTest) {
			session.replaceDialog("other");
		} else {
			session.replaceDialog("tools");
		}
	}
]);

bot.dialog('urine', [
    function (session) {
		var message = new builder.Message(session).text("以下是常用的項目，請問要驗哪些呢？例如如果你想驗urine routine，就打\"A\"或是\"a\"。").addAttachment({contentType:'image/jpeg', contentUrl:"https://i.imgur.com/qplvd7g.png"});
		builder.Prompts.text(session, message);
		},
	function (session, results){
		var order = results.response.toUpperCase();
		var otherTest = false;
		for (var i = 0, len = order.length; i < len; i++) {
			if (order[i] == "?" || order[i] == "？") {
				otherTest = true;
			} else if (order[i] in Case["tools"]["urine"]) {
				if (Array.isArray(Case["tools"]["urine"][results.response])) {
					var reply = new builder.Message().setText(session, Case["tools"]["urine"][order[i]][0]).addAttachment({contentType:'image/jpeg', contentUrl:Case["tools"]["urine"][order[i]][1]});
					session.send(reply);
				} else {
					session.send("%s：%s", Urine[order[i]],Case["tools"]["urine"][order[i]]);
				}
			} else if (order[i] in Urine) {
				session.send("%s：沒有特別發現or目前不需要", Urine[order[i]]);
			}
		}
		if (otherTest) {
			session.replaceDialog("other");
		} else {
			session.replaceDialog("tools");
		}
	}
]);

bot.dialog('image', [
    function (session) {
		var message = new builder.Message(session).text("以下是常用的項目，請問要照哪些呢？例如如果你想照CXR和ECG，就打\"AD\"或是\"ad\"。").addAttachment({contentType:'image/jpeg', contentUrl:"https://i.imgur.com/qPwQrCQ.png"});
		builder.Prompts.text(session, message);
		},
	function (session, results){
		var order = results.response.toUpperCase();
		var otherTest = false;
		for (var i = 0, len = order.length; i < len; i++) {
			if (order[i] == "?" || order[i] == "？") {
				otherTest = true;
			} else if (order[i] in Case["tools"]["image"]) {
				if (Array.isArray(Case["tools"]["image"][order[i]])) {
					var reply = new builder.Message().setText(session, Case["tools"]["image"][order[i]][0]).addAttachment({contentType:'image/jpeg', contentUrl:Case["tools"]["image"][order[i]][1]});
					session.send(reply);
				} else {
					session.send("%s：%s", Image[order[i]],Case["tools"]["image"][order[i]]);
				}
			} else if (order[i] in Image) {
				if (order[i] == "A") {
					var reply = new builder.Message().text("CXR如下圖").addAttachment({contentType:'image/jpeg', contentUrl:"https://i.imgur.com/YC05OCK.jpg"});
					session.send(reply);
				} else if (order[i] == "B") {
					var reply = new builder.Message().text("KUB如下圖").addAttachment({contentType:'image/jpeg', contentUrl:"https://i.imgur.com/wbyRoO2.png"});
					session.send(reply);					
				} else if (order[i] == "D") {
					var reply = new builder.Message().text("ECG如下圖").addAttachment({contentType:'image/jpeg', contentUrl:"https://i.imgur.com/nAa6h2h.png"});
					session.send(reply);						
				} else {
					session.send("%s：沒有特別發現or目前不需要", Image[order[i]]);
				}
			}
		}
		if (otherTest) {
			session.replaceDialog("other");
		} else {
			session.replaceDialog("tools");
		}
	}
]);

bot.dialog('other', [
    function (session) {
		builder.Prompts.text(session, "你有什麼其他想要檢查的呢？");
		},
	function (session, results){
		var ans = results.response.toLowerCase();
		var count = 0;
		for (var key in Blood) {
			if (Blood[key].toLowerCase().includes(ans)){
				session.send("%s：%s", Blood[key], Case["tools"]["blood"][key]);
				count++;
			}
		}	
		for (var key in Urine) {
			if (Urine[key].toLowerCase().includes(ans)){
				session.send("%s：%s", Urine[key], Case["tools"]["urine"][key]);
				count++;
			}
		}
		for (var key in Image) {
			if (Image[key].toLowerCase().includes(ans)){
				session.send("%s：%s", Image[key], Case["tools"]["image"][key]);
				count++;
			}
		}		
		for (var key in Case["tools"]["other"]) {
			if (key.includes(ans)){
				session.send("%s：%s", key,Case["tools"]["other"][key]);
				count++;
			}
		}
		if (count == 0) {
			session.send(ans+"：沒有特別發現or目前不需要");
			session.replaceDialog("tools");
		} else {
			session.replaceDialog("tools");
		}
	}
]);

bot.dialog('diagnosis', [
    function (session) {
		var help = ['等等我還想做其他檢查', '太難了吧~給我點選項~'];
		var message = new builder.Message(session).text("你的診斷是？直接打出你的診斷吧！").suggestedActions(
			builder.SuggestedActions.create(
				session, help.map(choice => new builder.CardAction.imBack(session, choice, choice))
			)
		);
		builder.Prompts.text(session, message);
    },
	function (session, results){
		var ans = results.response.toLowerCase();
		if (ans == "等等我還想做其他檢查") {
			session.replaceDialog("tools");
		} else if (ans == "太難了吧~給我點選項~") {
			session.replaceDialog("options");
		} else if (Case["diagnosis"].indexOf(ans) >= 0) {
			session.send("答對了！這位病人罹患的是"+Case["answer"]+"。")
			session.replaceDialog("summary");
		} else {
			session.send("錯囉！這位病人罹患的是"+Case["answer"]+"。")
			session.replaceDialog("summary");
		}
	}
]);

bot.dialog('options', [
    function (session) {
		var options = Case["options"];
		var message = new builder.Message(session).text("好吧，可能的診斷有以下幾個：").suggestedActions(
			builder.SuggestedActions.create(
				session, options.map(choice => new builder.CardAction.imBack(session, choice, choice))
			)
		);
		builder.Prompts.text(session, message);
	},
	function (session, results){
		if (Case["diagnosis"].indexOf(results.response) >= 0) {
			session.send("答對了！這位病人罹患的是"+Case["answer"]+"。")
			session.replaceDialog("summary");
		} else {
			session.send("錯囉！這位病人罹患的是"+Case["answer"]+"。")
			session.replaceDialog("summary");
		}
	}
]);

bot.dialog('summary', [
    function (session) {
		session.send(Case["summary"]);
		builder.Prompts.text(session, "隨便輸入一個訊息重來");
    },
	function (session) {
		session.replaceDialog("/");
	}
]);