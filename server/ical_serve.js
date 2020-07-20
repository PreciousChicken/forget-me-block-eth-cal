var ethers = require('ethers');
var moment = require('moment'); 
var fs = require('fs');
var CalStore = require('../build/contracts/CalStore.json');
const url = "http://127.0.0.1:7545";
const provider = new ethers.providers.JsonRpcProvider(url);
const contractAddress ='0xEb44EF401C6562B557B072F10bAd9428a12004bB';

// Connect to the network
// We connect to the Contract using a Provider, so we will only
// have read-only access to the Contract
let contract = new ethers.Contract(contractAddress, CalStore.abi, provider);

const vCalHeader = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//preciouschicken.com//forget-me-block-eth-cal\nCALSCALE:GREGORIAN\n"
const vCalFooter = "END:VCALENDAR\n"
var event, dtstamp, uid, dtstart, dtend, summary, description; 
var outputString = "";

async function getEvent(userAddress) {
	event = await contract.getEvents(userAddress);
	for (let i = 0; i < event.length; i++) {
		dtstamp = moment.unix(event[i].dtstamp).format("YYYYMMDD[T]HHmmss");
		uid = event[i].uid;
		dtstart = moment.unix(event[i].dtstart).format("YYYYMMDD[T]HHmmss");
		dtend = moment.unix(event[i].dtend).format("YYYYMMDD[T]HHmmss");
		summary = event[i].summary;
		description = event[i].description;
		outputString = outputString + 
			"BEGIN:VEVENT\n" + 
			"DTSTAMP:" + dtstamp + "\n" +
			"UID:" + uid + "@preciouschicken.com\n" +
			"DTSTART:" + dtstart + "\n" +
			"DTEND:" + dtend + "\n" +
			"SUMMARY:" + summary + "\n" + 
			"DESCRIPTION:" + description + "\n" +
			"END:VEVENT\n";
	}
	outputString = vCalHeader + outputString + vCalFooter;
	fs.writeFile('server/output.ics', outputString, function (err) {
		if (err) throw err;
		console.log('Saved!');
	});
}

getEvent("0x5aE61985C224be414018795Aff6C60F4cA37A8fE");

