// index.js
const { Worker } = require("worker_threads");
const URL =
	"https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";
const URL2 =
	"https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p?skuId=6426149";
const workersScraper = [];

function runService(workerData) {
	return new Promise((resolve, reject) => {
		const worker = new Worker("./service.js", {
			workerData,
		});
		worker.on("message", resolve);
		worker.on("error", reject);
		worker.on("exit", (code) => {
			if (code !== 0)
				reject(new Error(`Worker stopped with exit code ${code}`));
		});
	});
}

async function run(url) {
	const result = await runService(url);
	console.log(result);
}

run(URL).catch((err) => console.error(err));
run(URL2).catch((err) => console.error(err));

require("dotenv").config();
const http = require("http");
const express = require("express");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const app = express();
// const URL =
// "https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";

app.use(express.urlencoded({ extended: false }));

app.post("/sms", async (req, res) => {
	const twiml = new MessagingResponse();
	// console.log(getTimestamp(), " ", req.body.Body);
	const textResponse = req.body.Body.split(" ");
	try {
		// switch (textResponse[0].toLowerCase()) {
		// 	case "status":
		// 		twiml.message(`Server is running! Status: ${sc.status}`);
		// 		break;
		// 	case "last":
		// 		twiml.message(`Last in stock on: ${sc.lastMessageDate || "Unknown."}`);
		// 		break;
		// 	case "refresh":
		// 		const inStock = await sc.checkStock();
		// 		twiml.message(
		// 			`Checking status now... ${inStock ? "in stock!!!" : "not in stock."} `
		// 		);
		// 		break;
		// 	case "init":
		// 		await sc.init();
		// 		twiml.message(`Now initializing the stock checker.`);
		// 		break;
		// 	case "change":
		// 		if (textResponse[1].includes("bestbuy.com")) {
		// 			twiml.message(`changing url to ${textResponse[1]}.`);
		// 			sc.changeUrl(textResponse[1]);
		// 		} else {
		// 			twiml.message(
		// 				`Url was not changed, please follow this format:\nchange bestbuy.com/example/product/page`
		// 			);
		// 		}
		// 		break;
		// 	case "url":
		// 		twiml.message(`Url to track: ${sc.url}`);
		// 		break;
		// 	default:
		// 		twiml.message(
		// 			'Type: \n"status" - server status\n"last" - last date in stock' +
		// 				'\n"refresh" - force refresh of page' +
		// 				'\n"init" - initialize the stock checker\n"change" - change the url to check\n"url" - check the url to monitor\n'
		// 		);
		// 		break;
		// }

		twiml.message(
			'Type: \n"status" - server status\n"last" - last date in stock' +
				'\n"refresh" - force refresh of page' +
				'\n"init" - initialize the stock checker\n"change" - change the url to check\n"url" - check the url to monitor\n'
		);
	} catch (error) {
		if (error.message === "SupplyChecker has not been initialized!") {
			twiml.message(`SupplyChecker has not finished initializing...`);
		} else console.log(error.message);
	}
	res.writeHead(200, { "Content-Type": "text/xml" });
	res.end(twiml.toString());
});

http.createServer(app).listen(process.env.PORT || 1337, () => {
	console.log(" Express server listening on port 1337");
});
