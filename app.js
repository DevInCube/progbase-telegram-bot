const telegram = require('telegram-bot-api');

const api = new telegram({
	token: config.services.telegram.bot_token,
	updates: {
		enabled: config.services.telegram.bot_token ? true : false
	}
});

api.on('message', message => {
	let chat_id = message.chat.id;
	let username = message.chat.username;
	let parse_mode = 'Markdown';
	if (message.text === '/start') {
		taskdb.getTelegramByUsername(username)
			.then (rows => {
				if (rows.length === 0) {
					let text = `User with Telegram username *${message.chat.username}*` + 
						` is not registered on Progbase.`;
					api.sendMessage({chat_id, text, parse_mode});
				} else {
					return taskdb.setTelegramId(username, chat_id)
						.then (() => {
							let text = `Hello, *Master ${message.chat.username}*! Now you are subscribed to my notifications`; 
							text += '\r\n\r\nUse /help for my help.';
							api.sendMessage({chat_id, text, parse_mode});
						});					
				}
			})
			.catch (() => {
				let text = 'Something went wrong. Try again later.';
				api.sendMessage({chat_id, text, parse_mode});
			});
	} else if (message.text === '/scorespb' || message.text === '/scorespb2') {
		taskdb.getTelegramByUsername(username)
			.then (rows => {
				if (rows.length === 0) {
					let text = `User with Telegram username *${message.chat.username}*` + 
						` is not registered on Progbase.`;
					api.sendMessage({chat_id, text, parse_mode});
				} else {
					let course = 'progbase';
					if (message.text === '/scorespb2') course = 'progbase2';
					return Promise.all([
						taskdb.getTelegramUserResults(username, course),
						taskdb.getClassTasks(course)
					])
						.then(([task_results, tasks]) => {
							let text = `Your scores in *${course}* course: \r\n\r\n`;

							let requiredTasks = tasks.filter(x => !x.extra);
							let extraTasks = tasks.filter(x => x.extra);
							let requiredScore = 0;
							let maxRequiredScore = 0;
							let extraScore = 0;
							let maxExtraScore = 0;
							
							text += `Required tasks (${requiredTasks.length}):\r\n\`---\`\r\n`;
							for (let ti in requiredTasks) {
								let task = requiredTasks[ti];
								let res = task_results
									.find(result => result.task === task.task_id);
								let score = (res && res.score) ? res.score : 0;
								let maxScore = task.score || 0;
								text += `*${score}*/${maxScore}: \`${task.task_id}\`\r\n`;
								requiredScore += score;
								maxRequiredScore += maxScore;
							}
							text += `\`---\`\r\n*${requiredScore}*/${maxRequiredScore} _total required scores_`;

							if (extraTasks.length > 0) {
								text += '\r\n\r\n';
								text += `Extra tasks (${extraTasks.length}):\r\n\`---\`\r\n`;
								for (let ti in extraTasks) {
									let task = extraTasks[ti];
									let res = task_results
										.find(result => result.task === task.task_id);
									let score = (res && res.score) ? res.score : 0;
									let maxScore = task.score || 0;
									text += `*${score}*/${maxScore}: \`${task.task_id}\`\r\n`;
									extraScore += score;
									maxExtraScore += maxScore;
								}
								text += `\`---\`\r\n*${extraScore}*/${maxExtraScore} _total extra scores_`;

								text += `\r\n\r\n\`===\`\r\n*${requiredScore + extraScore}*/${maxRequiredScore + maxExtraScore}  _total scores_`;
							}
							text += '\r\n\r\n/help';

							api.sendMessage({chat_id, text, parse_mode});
						});		
				}
			})
			.catch (() => {
				let text = 'Something went wrong. Try again later.';
				api.sendMessage({chat_id, text, parse_mode});
			});
	} else if (message.text === '/cat') {
		try {
			let options = {
				method: 'GET',
				url: 'http://random.cat/meow'
			};
			rp(options)
				.then(response => {
					let text = JSON.parse(response).file.replace('\\', '');
					api.sendPhoto({chat_id, caption: 'Meow', photo: text});
				})
				.catch (() => {
					let text = 'Something went wrong. Try again later.';
					api.sendMessage({chat_id, text, parse_mode});
				});
		}catch(ex) {
			api.sendMessage({chat_id, text: String(ex), parse_mode});
		}
	} else {
		let text = ``;
		if (message.text !== '/help')
			text += `I can't understand your command *Master ${username}*.\r\n`;
		text += `What can I do for you?\r\n` + 
			`/help - get my help\r\n` + 
			`/scorespb - get all your scores report of Progbase course\r\n` + 
			`/scorespb2 - get all your scores report of Progbase-2 course\r\n` + 
			`/cat - get random cat image :3`;
		api.sendMessage({chat_id, text, parse_mode});
	}
});
