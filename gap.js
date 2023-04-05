const APP = require("./paging.config");

const { getAuthToken, getSpreadSheetValues } = require("./google/googleSheetsService.js");

const request = require("request");

const fs = require("fs");

const dayjs = require("dayjs");

const SparkPost = require("sparkpost");

const client = new SparkPost(process.env.ESAR_GAP_SEND_KEY);

async function getSheetData(spreadsheetId, sheetName) {

	try {

		const auth = await getAuthToken();

		const response = await getSpreadSheetValues({
			spreadsheetId,
			sheetName,
			auth
		})

		return response.data.values;

	} catch(error) {

		console.log(error.message, error.stack);

	}

}

function GetDaysNoComms (today, schedule) {

	const remainingShiftDays = schedule.filter((row) => { return today.isBefore(dayjs(`${row[0]} ${row[1]}, ${row[2]}`))});

	return remainingShiftDays.filter((row) => { return typeof row[11] == "undefined" || (row[11].length < 3)});

}

function GetDaysNoOL (today, schedule) {

	const remainingShiftDays = schedule.filter((row) => { return today.isBefore(dayjs(`${row[0]} ${row[1]}, ${row[2]}`))});

	return remainingShiftDays.filter((row) => { return typeof row[4] == "undefined" || (row[4].length < 3)});

}

function main() {

	let today = dayjs(), year = dayjs().format("YYYY"); // which of the Google Sheet tabs???

	getSheetData(APP.env.OL_SPREADSHEET, year).then((schedule) => {

		notify(GetDaysNoComms(today, schedule), GetDaysNoOL(today, schedule));

	});

}

notify = (c, o) => {

	let msg = "";

	msg += "<p>::::: Blank COMMS :::::</p>";

	c.forEach((data) => msg += `<div>${data[0]} ${data[1]}, ${data[2]}</div>`);

	msg += "<p>::::: Blank OL :::::</p>";

	o.forEach((data) => msg += `<div>${data[0]} ${data[1]}, ${data[2]}</div>`);

	client.transmissions.send({
		content: {
			from: process.env.ESAR_GAP_SENDER,
			subject: "ESAR duty gaps",
			html: msg
		},
		recipients: [
			{
				address: process.env.ESAR_GAP_RECEIVER
			}
		]
		})
		.then(data => {
		})
		.catch(err => {
	})

}

main()
