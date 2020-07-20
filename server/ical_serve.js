var ethers = require('ethers');
var moment = require('moment'); 
var CalStore = require('../build/contracts/CalStore.json');
const url = "http://127.0.0.1:7545";
const provider = new ethers.providers.JsonRpcProvider(url);
const contractAddress ='0xCC35C090348981BEB6717a3310Ec3E6634d42828';

// Connect to the network
// We connect to the Contract using a Provider, so we will only
// have read-only access to the Contract
let contract = new ethers.Contract(contractAddress, CalStore.abi, provider);

const vCalHeader = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//preciouschicken.com//forget-me-block-eth-cal\nCALSCALE:GREGORIAN\nBEGIN:VEVENT\n"
const vCalFooter = "END:VEVENT\nEND:VCALENDAR\n"
var dtstamp, uid, dtstart, dtend, summary, description;
var event;

async function getEvent(userAddress) {
	// TODO: Needs to loop for multiple events
	event = await contract.getEvents(userAddress);
	dtstamp = moment.unix(event[0].dtstamp).format("YYYYMMDD[T]HHmmss");
	uid = event[0].uid;
	dtstart = moment.unix(event[0].dtstart).format("YYYYMMDD[T]HHmmss");
	dtend = moment.unix(event[0].dtend).format("YYYYMMDD[T]HHmmss");
	summary = event[0].summary;
	description = event[0].description;

	console.log("This is the finalised ics: " + 
		vCalHeader + 
		"DTSTAMP:" + dtstamp + "\n" +
		"UID:" + uid + "@preciouschicken.com\n" +
		"DTSTART:" + dtstart + "\n" +
		"DSTEND:" + dtend + "\n" +
		"SUMMARY:" + summary + "\n" + 
		"DESCRIPTION:" + description + "\n" +
		vCalFooter);
}

getEvent("0x5aE61985C224be414018795Aff6C60F4cA37A8fE");

