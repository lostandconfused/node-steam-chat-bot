﻿var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var _ = require('underscore');
/*
Trigger that converts between currencies
*/

var TriviaTrigger = function() {
	TriviaTrigger.super_.apply(this, arguments);
};

util.inherits(TriviaTrigger, BaseTrigger);

var type = "TriviaTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new TriviaTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!trivia";
		trigger.options.admins = trigger.options.admins || [];
		trigger.admins = trigger.options.admins;
		trigger.respectsMute = false;
		trigger.room = trigger.options.rooms[0];
	return trigger;
};
TriviaTrigger.prototype._onLoad = function() {
		if(!(this.options.rooms instanceof Array && this.options.rooms.length==1 && typeof this.options.rooms[0] === 'string')) {
			this.winston.error(this.chatBot.name+" "+this.name+": options.rooms needs to be a single-length array");
			return false;
		} else if (!(this.options.admins instanceof Array && this.options.admins.length >0)) {
console.log(this.options);
			this.winston.error(this.chatBot.name+" "+this.name+": options.admins needs at least one entry!");
			return false;
		} else return true;
}
// Return true if a message was sent
TriviaTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message.toLowerCase());
}

// Return true if a message was sent
TriviaTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message.toLowerCase());
}

TriviaTrigger.prototype._respond = function(toId, userId, message) {
this.winston.info(message);
this.winston.info('admins',this.admins);
console.log(userId);
	var that = this;
	var query = this._stripCommand(message, this.options.command);
	if(query && userId in this.admins) {
		console.log('query started:'+query);
		if(query.toLowerCase()==="question") {
console.log('resetting question');
			this.question=false;
			this.answer=false;
			this._sendMessageAfterDelay(toId, "Question & Answer reset");
			this.chatBot.setUnmoderated(this.room);
		} else if(this._stripCommand(query,'question')) {
			var pair = this._stripCommand(query,'question').split('||');
			if(pair.length<1) {
				this.question = pair.splice(0,1);
				this.answer = pair.join('||').toLowerCase().split('||');
				this.chatBot.setUnmoderated(this.room);
				this._sendMessageAfterDelay(this.room,this.question);
			} else {
				this._sendMessageAfterDelay(toId,"Invalid. You need a question, and at least one answer. Everything should be separated by ||");
			}
		} else if(query.toLowerCase()==='admin') {
			var admins = []; var counter = 0;
			_.each(this.admins, function(admin){
				admins[counter] = counter+": "+that.chatBot._userString(admin);
			});
			this._sendMessageAfterDelay(toId,admins);
		} else if(this._stripCommand(query,'admin add') && userId in this.options.admins) {
			var newadmin = this._stripCommand(query,'admin add');
			this.admins[this.admins.length]=newadmin;
			this._sendMessageAfterDelay(toId,"Added "+that.chatBot._userString(newadmin)+" to admins");
		} else if(this._stripCommand(query,'admin del') && userId in this.options.admins) {
			adminnum = this._stripCommand(query,'admin del');
			if(parseInt(adminnum).toString()===adminnum) {
				var adminnum = parseInt(adminnum);
				if(this.admins.length < adminnum) {
					var oldadmin = this.admins.splice(adminnum,1);
					this._sendMessageAfterDelay(toId,"Removed admin "+that.chatBot._userString(oldadmin));
				} else {
					this._sendMessageAfterDelay(toId,"No such admin");
				}
			} else if(adminnum in this.admins) {
				var oldadmin = this.admins.splice(this.admins.indexOf(adminnum),1);
				this._sendMessageAfterDelay(toId,"Removed admin "+that.chatBot._userString(oldadmin));
			} else {
				this._sendMessageAfterDelay(toId,"No such admin");
			}
		} else if(userId in this.options.admins) {
			this._sendMessageAfterDelay(toId,"Valid commands: '$1 question $QUESTION||$ANSWER', '$1 admin', '$1 admin add $STEAMID64', '$1 admin del $#', '$1 admin del $STEAMID64', '$1 say $SOMETHING', '$1 answered'".split("$1").join(this.options.command))
		} else if(query.toLowerCase()==="answered") {
			this.chatBot.setModerated(this.room);
		} else if (this._stripCommand(query,'say')) {
			this._sendMessageAfterDelay(this.room,this._stripCommand(query,'say'));
		}
		return true;
	} else if(toId!=userId && this.answer) {
		if(message.toLowerCase() in this.answer) {
			this._sendMessageAfterDelay(toId,this.chatBot._userName(userId)+" is correct! The answer was:\n"+message);
			this.chatBot.setModerated(this.room);
			return true;
		}
		return false;
	}
	return false;
}

TriviaTrigger.prototype._stripCommand = function(message, command) {
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0 && message.length > command.length) {
		return message.substring(command.length+1);
	}
	return false;
}