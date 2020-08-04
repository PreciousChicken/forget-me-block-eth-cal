var ethers = require('ethers');
var moment = require('moment'); 
var fs = require('fs');
var CalStore = require('../client/src/contracts/CalStore.json');
// const url = "http://127.0.0.1:7545";

// Below is for ropsten
// const network = "ropsten";
// const provider = ethers.getDefaultProvider(network, {
//     infura: "79351be4a978403f9bc187aa5060616c"
// });
// const provider = new ethers.providers.JsonRpcProvider(url);

// Below is for local
const url = "http://127.0.0.1:7545";
const provider = ethers.providers.getDefaultProvider(url);




const contractAddress ='0x58A5d6F0DB34d4616D8343704264c12fD44C0dfd';
var express = require('express')
var cors = require('cors')
var app = express()
 
app.use(cors())

// Connect to the network
// We connect to the Contract using a Provider, so we will only
// have read-only access to the Contract
let contract = new ethers.Contract(contractAddress, CalStore.abi, provider);

const vCalHeader = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//preciouschicken.com//forget-me-block-eth-cal\nCALSCALE:GREGORIAN\n"
const vCalFooter = "END:VCALENDAR\n"
var event, dtstamp, uid, dtstart, dtend, summary, description; 



async function getEvent(userAddress) {
	let outputString = "";
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

	// Produces output file, no longer needed?
	// fs.writeFile('output.ics', outputString, function (err) {
	// 	if (err) throw err;
	// 	console.log('Saved!');
	// });
	//
	return outputString;
}

// Root query, test purposes only
app.get('/', (req,res) => {
	console.log('API Called');
	res.send('API online really')
});

app.get('/listen', (req, res) => {
	const { address } = req.query;
	let iCal;
	// getEvent(address).then(cal => {iCal = cal});
	getEvent(address).then(cal => {return res.send(cal)});
	console.log('API listen');
	console.log(address);
	// res.send('API listen send')
	// return res.send("Hello");
});


// getEvent("0x43126483FA825ED8F9E8a75Bee4CC57Ba1f2cFa2");
app.listen(3305, () => {
	console.log('Db server listening on port 3305')
});
//TODO: Get server to return
