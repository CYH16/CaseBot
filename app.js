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

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
	function (session) {
		session.send("嗨你好");
		session.beginDialog('scene');
	},
]);

bot.dialog('scene', [
    function (session) {
        session.send("%s", Data["scene"]);
		session.beginDialog('PE');
    }
]);

bot.dialog('PE', [
    function (session) {
		if (Array.isArray(Data["PE"])) {
			var reply = new builder.Message().setText(session, Data["PE"][0]).addAttachment({contentType:'audio', contentUrl:Data["PE"][1]});
			session.send(reply);
			session.beginDialog('tools');
		} else {
			session.send("%s", Data["PE"]);
			session.beginDialog('tools');
		}    
	}
]);

bot.dialog('tools', [
    function (session) {
		var tools = Object.keys(Data["tools"]);
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
		} else if (results.response in Data["tools"]) {
			if (Array.isArray(Data["tools"][results.response])) {
				var reply = new builder.Message().setText(session, Data["tools"][results.response][0]).addAttachment({contentType:'image/jpeg', contentUrl:Data["tools"][results.response][1]});
				session.send(reply);
				session.replaceDialog("tools")
			} else {
				session.send("%s", Data["tools"][results.response]);
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
		} else if (Data["diagnosis"].indexOf(results.response) >= 0) {
			session.send("答對了！這位病人罹患的是急性心包膜炎(acute pericarditis)。")
			session.replaceDialog("summary");
		} else {
			session.send("錯囉！這位病人罹患的是急性心包膜炎(acute pericarditis)。")
			session.replaceDialog("summary");
		}
	}
]);

bot.dialog('options', [
    function (session) {
		var options = Data["options"];
		var message = new builder.Message(session).text("好吧，可能的診斷有以下幾個：").suggestedActions(
			builder.SuggestedActions.create(
				session, options.map(choice => new builder.CardAction.imBack(session, choice, choice))
			)
		);
		builder.Prompts.text(session, message);
	},
	function (session, results){
		if (Data["diagnosis"].indexOf(results.response) >= 0) {
			session.send("答對了！這位病人罹患的是急性心包膜炎(acute pericarditis)。")
			session.replaceDialog("summary");
		} else {
			session.send("錯囉！這位病人罹患的是急性心包膜炎(acute pericarditis)。")
			session.replaceDialog("summary");
		}
	}
]);

bot.dialog('summary', [
    function (session) {
		builder.Prompts.text(session, Data["summary"]);
    },
	function (session) {
		session.replaceDialog("scene");
	}
]);