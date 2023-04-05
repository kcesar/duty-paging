const APP = require("./paging.config");

const { getAuthToken, getSpreadSheetValues } = require('./google/googleSheetsService.js');

const request = require("request");

const fs = require("fs");

async function getSheetData(spreadsheetId, sheetName) {

	try {

		const auth = await getAuthToken();

		const response = await getSpreadSheetValues({
			spreadsheetId,
			sheetName,
			auth
		})

		console.log(JSON.stringify(response.data, null, 2));

		return response.data.values;

	} catch(error) {

		console.log(error.message, error.stack);

	}

}

function main() {

	console.log(`Reading from ${APP.env.OL_SPREADSHEET}`);

	getSheetData(APP.env.OL_SPREADSHEET, "2022" /*dayjs().format('YYYY')*/).then((schedule) => {

	});

}

main()