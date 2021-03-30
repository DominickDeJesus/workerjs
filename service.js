const { workerData, parentPort } = require("worker_threads");
const SupplyChecker = require("./supplyChecker");
const cron = require("node-schedule");
// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
console.log(workerData);
const sc = new SupplyChecker(workerData);

sc.init()
	.then(() =>
		cron.scheduleJob("*/5 * * * *", async function () {
			await sc.checkStock();
		})
	)
	.catch((error) => {
		console.log(error.message);
	});

parentPort.postMessage({ hello: workerData });
