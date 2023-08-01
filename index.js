#!/usr/bin/env node
const chalk = require('chalk')
const Sequelize = require('sequelize');
const child_process = require('child_process')
const { version } = require("./package.json")
const fs = require('fs');
const { LogType, log } = require("./src/logger.js")

if (!fs.existsSync("./config.json")) {
	log(LogType.Error, `Config does not exist! Make a copy of the file "config.template.json", rename it to "config.json", and edit the values inside the config.`)
	process.exit(1)
}

const { discord_bot } = require("./config.json")
const { sendWebhook } = require("./webhook.js")

//load colors
process.colors = require('./colors.json')

try{process.commit = child_process.execSync('git rev-parse HEAD').toString().substring(0, 7)} catch(e) {process.commit = "[git not installed]"}

let versionStr = ` Version ${version} (commit ${process.commit})`

console.log(`${" ".repeat((versionStr.length-"lunarrec".length)/2)}${chalk.hex(process.colors.logo)("LunarRec")}\n${versionStr}\n${"=".repeat(versionStr.length+1)}`)

//Reset data command
if (process.argv[2] == "reset"){
	try {
		log(LogType.Info, "Deleting Database...")
		fs.unlinkSync("./database.sqlite")
	} catch(e){
		log(LogType.Error, `Something bad happened while erasing the database. If the database never existed, this is expected.\n\n${e}`)
	}

	log(LogType.Info, "Deleting Profile Images...")
	let dir = "./profileImages/"
	const files = fs.readdirSync(dir);
	files.forEach((file) => {
		if (file === "__default.png") return;
		fs.unlinkSync(`${dir}/${file}`);
	});

	log(LogType.Info, "Reset complete!")
	process.exit()
}

//Init DB
process.db = require('./database.js')

//Admin panel
if (process.argv[2] == "admin"){
	return require("./src/admin.js").admin()
}

async function start() {
	//check for first run
	if (!fs.existsSync("./.first_run")) {
		fs.writeFileSync("./.first_run", "# Dummy file generated by LunarRec.\n# Used to tell LunarRec that the first time setup has executed already.\n# Delete this if you want to re-run the first time setup.")
		console.log(`Hello there 👋! 
It looks like this is your first time running LunarRec.
Please check out the github repo for first time install steps.
Also note that LunarRec is still a heavy work in progress project that is not production ready.

To read this message again, Delete the file ".first_run" in the root directory of LunarRec.
`)
	}

    await process.db.users.sync()

	if (discord_bot.enabled) {
		log(LogType.Bot, "Discord Bot enabled!")
		//push commands
		require(`./src/bot/deploy.js`)

		//start the uhhh bot
		require('./src/bot/index.js')
	}

    require('./src/server.js').start()

	sendWebhook("✅ **This LunarRec instance has started!**")
}

start()