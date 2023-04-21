const APP = require("./paging.config");

const { getAuthToken, getSpreadSheetValues } = require('./google/googleSheetsService.js');

const request = require("request");

const fs = require("fs");

const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween')

dayjs.extend(customParseFormat)
dayjs.extend(isBetween)

const PREFIX_OL="OL=";
const PREFIX_COMMS="COMMS=";

const LOGFILE = `${__dirname}/log.weekly.txt`

const abbrev = {

	"Sunday":"Su", "Monday":"M", "Tuesday":"Tu", "Wednesday":"W", "Thursday":"Th", "Friday":"F", "Saturday":"Sa"

};

async function getSheetData(spreadsheetId, sheetName) {

	try {

		const auth = await getAuthToken();

		const response = await getSpreadSheetValues({
			spreadsheetId,
			sheetName,
			auth
		})

		// console.log(JSON.stringify(response.data, null, 2));

		return response.data.values;

	} catch(error) {

		console.log(error.message, error.stack);

	}

}

function getWeeksFilteredData (schedule) {

	const now = dayjs(),

		next_week_this_day = dayjs().add(7, "day");

	const resp = schedule.filter((row) => {

		let month = row[0], dayofmonth = row[1], year = row[2];

		if (parseInt(dayofmonth, 10) < 10) dayofmonth = `0${dayofmonth}`;

		const day_converted = dayjs(`${month} ${dayofmonth}, ${year}`, "MMMM DD, YYYY");

		return day_converted.isBetween(now, next_week_this_day, 'day', '[)');

	});

	return resp;

}

function getThePlayers (week_view) {

	let ols = [], comms = [], last_comms = [];

	week_view.forEach((row) => {

		ols[row[4]] = { named:row[4], phone:row[6], days:[] };

		// operate in single weekly comms operator mode by default
		if ((!row[11]) || (row[11].length < 4)) {
						row[11] = last_comms[0], row[12] = last_comms[1];
		}

		comms[row[11]] = { named:row[11], phone:row[12], days:[] };

		last_comms = [row[11], row[12]]; // Save away in case we're operating in single weekly comms

	});

	week_view.forEach((row) => ols[row[4]].days.push(abbrev[row[3]]));
	week_view.forEach((row) => comms[row[11]].days.push(abbrev[row[3]]));

	// Sanitize (e.g. remove undefined values)
	Object.keys(comms).forEach((k) => { comms[k].phone = comms[k].phone ? comms[k].phone : ""; });

	return [ols, comms];

}

function format (player_array) {

	let response = "";

	if (Object.keys(player_array).length > 1) {

		let c = [];

		Object.keys(player_array).forEach((d) => {

			c.push(`${player_array[d].named} ${player_array[d].phone} ${player_array[d].days}`);

		});

		response = c.join("; ").toString();

	} else {

		const single = player_array[Object.keys(player_array)[0]];

		response = `${single.named} ${single.phone}`;

	}

	return response;

}

function main() {

	let year = dayjs().format('YYYY'); // which of the Google Sheet tabs???

	const month = dayjs().month(), dayofmonth = dayjs().date();

	// Ops better have the OL scheduled before last week-ish of December
	if ((month == 11) && (dayofmonth > 22)) year = dayjs().year()+1;

	getSheetData(APP.env.OL_SPREADSHEET, year).then((schedule) => {

		let msg_for_text = 'DUTY CHANGE: ';

		const players = getThePlayers(getWeeksFilteredData(schedule));

		Object.keys(players[0]).forEach((k) => players[0][k].days = players[0][k].days.join('')); // OL
		Object.keys(players[1]).forEach((k) => players[1][k].days = players[1][k].days.join('')); // Comms

		msg_for_text += `${PREFIX_OL}${format(players[0])}; ${PREFIX_COMMS}${format(players[1])}`;

		sendDutyPage(msg_for_text);

	});

}

sendDutyPage = msg => {

	const scrubbed = msg.replace(" undefined", " TBA");

	request({

		uri:APP.env.PAGER_WWW,

		method:"POST",

		form: {

			From:APP.env.SENDER_PHONE_NUMBER,

			Body:scrubbed

		}

	}, (error, response, body) => {

		fs.appendFileSync(LOGFILE, `sendDutyPage::${dayjs().format('YYYY-MM-DD HH:mm:ss')} ==> ${scrubbed}\r\n`);

	});

}

main()