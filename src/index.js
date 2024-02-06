import PostalMime from 'postal-mime';
const { convert } = require('html-to-text');

async function streamToArrayBuffer(stream, streamSize) {
	let result = new Uint8Array(streamSize);
	let bytesRead = 0;
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		result.set(value, bytesRead);
		bytesRead += value.length;
	}
	return result;
}

export default {
	async email(message, env, ctx) {
		const botToken = ""; // Bot token here
		const chatId = 0; // Chat ID here

		const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
		const parser = new PostalMime();
		const parsedEmail = await parser.parse(rawEmail);

		const params = new URLSearchParams();
		const msgTo = message.to;
		const msgFrom = message.from;
		const msgText = convert(parsedEmail.html);
		const text = "From: " + msgFrom + "%0ATo: " + msgTo;

		await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage?chat_id=" + chatId + "&text=" + text, {
			method: "POST",
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded', // Set the content type to URL-encoded
			},
			body: params.toString()
		}).then(async response => {
			const msgId = response.message_id;
			await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json', // Set the content type to JSON
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: msgText
				})
			});
		});
	}
}