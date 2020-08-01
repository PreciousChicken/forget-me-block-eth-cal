import React, { useState  } from 'react';
import './App.css';
import DateFnsUtils from "@date-io/date-fns";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { Button, TextField } from '@material-ui/core';
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from '@material-ui/pickers';
import { ethers } from "ethers";
import CalStore from "./contracts/CalStore.json";

const contractAddress ='0x71C425e294EcC704576D809415dA74b00588E263';

let provider;
let signer;
let contractCalStore;
let noProviderAbort = true;

// Ensures metamask or similar installed
if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
	try{
		// Ethers.js set up, gets data from MetaMask and blockchain
		window.ethereum.enable().then(
			provider = new ethers.providers.Web3Provider(window.ethereum)
		);
		signer = provider.getSigner();
		contractCalStore = new ethers.Contract(contractAddress, CalStore.abi, signer);
		noProviderAbort = false;
	} catch(e) {
		noProviderAbort = true;
	}
}


function MyCalendar(props) {
	const localizer = momentLocalizer(moment)
	const [eventsList, setEventsList] = useState(props.ethEvents);
	// console.log("mycalprop", eventsList);

	function handleSelect ({ start, end }) {
		const title = window.prompt('New Event name')
		if (title) {
			var newEvent = {
				start: start,
				end: end,
				title: title 
			}
			setEventsList([...eventsList, newEvent]);
		}
	}

	return (
		<div>
		<span>eventsList: {eventsList[0]}</span>
		<Calendar
		selectable
		defaultView="week"
		defaultDate={new Date()}
		localizer={localizer}
		events={eventsList}
		startAccessor="start"
		endAccessor="end"
		style={{ height: 500 }}
		onSelectSlot={handleSelect}
		/>
		</div>
	)
}
function App() {
	const [selectedStartDate, handleStartDateChange] = useState(new Date());
	const [selectedEndDate, handleEndDateChange] = useState(new Date());
	const [walAddress, setWalAddress] = useState('0x00');
	const [calEvents, setCalEvents] = useState([]);

	// Aborts app if metamask etc not present
	if (noProviderAbort) {
		return (
			<div>
			<h1>Error</h1>
			<p><a href="https://metamask.io">Metamask</a> or equivalent required to access this page.</p>
			</div>
		);
	}

	signer.getAddress()
		.then(response => {
			setWalAddress(response);	
			contractCalStore.getEventsObj(response)
				.then(blockEvents => {
					setCalEvents(blockEvents)}
				)
		});

	// Handles user store message form submit
	const handleNewEvent = (event) => { 
		let unixStart = moment(selectedStartDate).unix();
		let unixEnd = moment(selectedEndDate).unix();
		contractCalStore.storeEvent(moment().unix(), unixStart, unixEnd, event.target.title.value,event.target.description.value);
		event.preventDefault();
	};

	const getBlockchainEvent = (event) => { 
		contractCalStore.getEventsObj(walAddress).then(msg => console.log(msg[0].description));
		event.preventDefault();
	};

	return (
		<main>
		<h1>Forget-me-Block: Ethereum Calendar</h1>
		<MyCalendar ethEvents={calEvents} />

		<h2>New event:</h2>
		<form onSubmit={handleNewEvent}>

		<div className="block-element">
		<TextField 
		name="title" id="outlined-basic" label="Title" variant="outlined" />
		</div>
		<div className="block-element">
		<MuiPickersUtilsProvider utils={DateFnsUtils}>	
		<KeyboardDateTimePicker 
		format="yyyy-MM-dd HH:mm"
		ampm="false"
		label="Start"
		inputVariant="outlined"
		value={selectedStartDate} onChange={handleStartDateChange} />
		</MuiPickersUtilsProvider>
		</div>
		<div className="block-element">
		<MuiPickersUtilsProvider utils={DateFnsUtils}>	
		<KeyboardDateTimePicker 
		format="yyyy-MM-dd HH:mm"
		ampm="false"
		label="End"
		inputVariant="outlined"
		value={selectedEndDate} onChange={handleEndDateChange} />
		</MuiPickersUtilsProvider>
		</div>
		<div className="block-element">
		<TextField
		name="description"      
		id="outlined-multiline-static"
		label="Description"
		style = {{width: 450}}
		multiline
		rows={4}
		variant="outlined"
		/>
		</div>
		<div className="block-element">
		<Button variant="contained" color="primary" type="submit">
		Submit
		</Button>

		</div>
		</form>
		<h2>Get Block</h2>
		<form onSubmit={getBlockchainEvent}>
		<Button variant="contained" color="primary" type="submit">
		Submit
		</Button>

		</form>
		<h2>Subscribe to this calendar in your email application:</h2>

		<p>https://ezcontract.hopto.org/api/listen?address={walAddress}</p>

		<p>actually for testing it is:</p>
		<p>http://localhost:3305/listen?address={walAddress}</p>
		<p>Instructions for <a href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-cff1429c-5af6-41ec-a5b4-74f2c278e98c">Outlook</a> and <a href="https://support.mozilla.org/en-US/kb/creating-new-calendars#w_icalendar-ics">Thunderbird</a></p>



		</main>
	);
}

export default App;

// Old Input calendar buttons
//
