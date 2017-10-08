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
const Data = JSON.parse(require('fs').readFileSync('./case_data.json', 'utf8'));

var bot = new builder.UniversalBot(connector, [
	function (session) {
		var go = ['隨機幫我挑吧'];
		var message = new builder.Message(session).text("嗨你好，你想要練習哪一個case呢？").suggestedActions(
			builder.SuggestedActions.create(
				session, go.map(choice => new builder.CardAction.imBack(session, choice, choice))
			)
		);
        builder.Prompts.text(session, message);
	},
	function (session, results){
		if (results.response == "隨機幫我挑吧") {
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
			var message = new builder.Message().setText(session, Case["inquiry"][0]).addAttachment({contentType:'image', contentUrl:Case["inquiry"][1]}).suggestedActions(
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
				var reply = new builder.Message().setText(session, Case["PE"][0]).addAttachment({contentType:'image', contentUrl:Case["PE"][2]});
				session.send(reply);
				session.replaceDialog('tools');
			} else if (Case["PE"][1] == "音") {
				var reply = new builder.Message().setText(session, Case["PE"][0]).addAttachment({contentType:'audio', contentUrl:Case["PE"][2]});
				session.send(reply);
				session.replaceDialog('tools');				
			} else if (Case["PE"][1] == "圖+音") {
				var reply = new builder.Message().setText(session, Case["PE"][0]).addAttachment({contentType:'image', contentUrl:Case["PE"][2]}).addAttachment({contentType:'audio', contentUrl:Case["PE"][3]});
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
		var tools = Object.keys(Case["tools"]);
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
		} else if (results.response in Case["tools"]) {
			if (Array.isArray(Case["tools"][results.response])) {
				var reply = new builder.Message().setText(session, Case["tools"][results.response][0]).addAttachment({contentType:'image', contentUrl:Case["tools"][results.response][1]});
				session.send(reply);
				session.replaceDialog("tools")
			} else {
				session.send("%s", Case["tools"][results.response]);
				session.replaceDialog("tools");
			}
		} else {
			session.send("請選擇我們現在有的工具喔~");
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
		if (results.response == "等等我還想做其他檢查") {
			session.replaceDialog("tools");
		} else if (results.response == "太難了吧~給我點選項~") {
			session.replaceDialog("options");
		} else if (Case["diagnosis"].indexOf(results.response) >= 0) {
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