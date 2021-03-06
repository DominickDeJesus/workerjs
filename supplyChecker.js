require("dotenv").config();
const puppeteer = require("puppeteer");

class SupplyChecker {
	constructor(url) {
		this.finishedInit = false;
		this.status = "uninitialized";
		this.url = url;
		this.lastMessageDate = null;
		this.lastScreenPath = null;
		this.tag = `button[data-sku-id="${url.split("skuId=")[1]}"]`;
		this.browserOption =
			process.platform === "linux"
				? {
						args: ["--no-sandbox"],
				  }
				: null;
	}
	async init() {
		console.log(this.getTimestamp(), " Initializing browser");

		this.browser = await puppeteer.launch({
			headless: true,
			...this.browserOption,
		});

		this.page = await this.browser.newPage();
		await this.page.setDefaultNavigationTimeout(0);
		await this.page.setRequestInterception(true);

		this.page.on("request", (req) => {
			if (
				req.resourceType() == "stylesheet" ||
				req.resourceType() == "font" ||
				req.resourceType() == "image"
			) {
				req.abort();
			} else {
				req.continue();
			}
		});

		await this.page.goto(this.url, {
			waitUntil: "load",
		});
		this.finishedInit = true;
		this.status = "initialized";
		console.log(this.getTimestamp(), " Finished initializing");
	}

	async checkStock() {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		this.status = "loading";
		console.log("checking stock");
		await this.page.reload();
		console.log("reloaded");
		if (
			(await this.isInStock(this.page, this.tag)) &&
			!isToday(this.lastMessageDate)
		) {
			await this.screenshot();
			await this.sendTextNotification(this.url);
			this.status = "waiting";
			return true;
		}
		this.status = "waiting";
		return false;
	}

	async isInStock(page, tag) {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		const $ = require("cheerio");
		try {
			console.log(this.getTimestamp(), " Loading page content");
			const html = await page.content();
			const buttonText = $(tag, html).text();

			if (buttonText.toLocaleLowerCase() === "sold out") {
				console.log(
					this.getTimestamp(),
					` Out of stock! Tag content: ${buttonText}`
				);
				return false;
			} else if (buttonText.toLocaleLowerCase().includes("add")) {
				console.log(
					this.getTimestamp(),
					" In stock!!! Tag content: ",
					buttonText
				);
				return true;
			} else {
				console.log(
					this.getTimestamp(),
					" Button content unknown! Tag html content: ",
					`${$(tag, html).html()}`
				);
				return false;
			}
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	async changeUrl(url) {
		this.status = "changing";
		this.url = url;
		this.lastMessageDate = null;
		this.tag = `button[data-sku-id="${url.split("skuId=")[1]}"]`;
		await this.page.goto(this.url, {
			waitUntil: "load",
		});
		console.log(this.getTimestamp(), "Changed the url to " + url);
		await this.checkStock();
	}

	async screenshot() {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		const cloudinary = require("cloudinary").v2;
		this.lastMessageDate = new Date();
		const tempPath = `./screenshot.png`;
		await this.page.screenshot({
			path: tempPath,
			fullPage: true,
		});
		const response = await cloudinary.uploader.upload(tempPath);
		this.lastScreenPath = response.secure_url;
	}
	async sendTextNotification(url) {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		this.status = "texting";
		try {
			const client = require("twilio")(
				process.env.TWILIO_ACCOUNT_SID,
				process.env.TWILIO_AUTH_TOKEN
			);

			const message = await client.messages.create({
				body: `In stock alert!!! \n\n${url}`,
				from: process.env.TWILIO_PHONE_NUM,
				mediaUrl: this.lastScreenPath,
				to: process.env.TO_PHONE_NUM,
			});

			console.log(this.getTimestamp(), " Message sent! ", message.sid);
		} catch (error) {
			console.log(
				this.getTimestamp(),
				"Something went wrong, message was not sent\n",
				error
			);
		}
	}
	getTimestamp() {
		return (
			"[" +
			new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) +
			"]"
		);
	}

	isToday = (someDate) => {
		if (!someDate) return false;
		const today = new Date();
		return (
			someDate.getDate() == today.getDate() &&
			someDate.getMonth() == today.getMonth() &&
			someDate.getFullYear() == today.getFullYear()
		);
	};
}

module.exports = SupplyChecker;
