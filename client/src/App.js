import React, { useState, useEffect  } from 'react';
import './App.css';
import DateFnsUtils from "@date-io/date-fns";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { Button, TextField } from '@material-ui/core';
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from '@material-ui/pickers';
import { ethers } from "ethers";
import CalStore from "./contracts/CalStore.json";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const contractAddress ='0xFD151DF1F42C30e24CB9d557F6DFB58237174Ef5';

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




function App() {
	const refreshMinutes = 1; // Changes minutes checks blockchain
	const [selectedStartDate, handleStartDateChange] = useState(new Date());
	const [selectedEndDate, handleEndDateChange] = useState(new Date());
	const [walAddress, setWalAddress] = useState('0x00');
	const [eventsList, setEventsList] = useState([]);
	const localizer = momentLocalizer(moment);
	const [open, setOpen] = React.useState(false);
	const [activeEventTitle, setActiveEventTitle] = useState("");
	const [activeEventDesc, setActiveEventDesc] = useState("");
	const [activeEventId, setActiveEventId] = useState(0);
	const [activeEventStart, setActiveEventStart] = useState(new Date());
	const [activeEventEnd, setActiveEventEnd] = useState(new Date());
	const [visibleEvents, setVisibleEvents] = useState([]);
	const [synchronisingEvents, setSyncEvents] = useState([]);

	useEffect(() => {
		let tempArray = [];
		for (let i = 0; i < synchronisingEvents.length; i++) {
			if (synchronisingEvents[i].isVisible === true) {
				tempArray.push(synchronisingEvents[i]);
			}
		}
		console.log("65 tempArray", tempArray);
		setVisibleEvents(tempArray);
	}, [synchronisingEvents]);


	// Aborts app if metamask etc not present
	if (noProviderAbort) {
		return (
			<div>
			<h1>Error</h1>
			<p><a href="https://metamask.io">Metamask</a> or equivalent required to access this page.</p>
			</div>
		);
	}

	const eventSyncStatus = {
		BLOCK: 'block',
		ADD: 'add',
		DELETE: 'delete',
	}

	function Event(allDay, start, end, title, desc) {
		this.allDay = allDay;
		this.start = start;
		this.end = end;
		this.title = title;
		this.description = desc;
		this.isVisible = true;
		this.syncStatus = eventSyncStatus.ADD;
		this.id = moment().unix();
	}

	// Handles user store message form submit
	function addEvent (event) {
		console.log(event.end);
	// function addEvent ({ start, end, allDay }) { 
		const title = window.prompt('New Event name');
		if (title) {
			let unixStart = moment(event.start).unix();
			let unixEnd = moment(event.end).unix();
			let newEvent = new Event(
				false,
				event.start, 
				event.end,
				title,
				title
			);
			contractCalStore.storeEvent(
				newEvent.id, 
				unixStart, 
				unixEnd, 
				newEvent.title,
				newEvent.description
			).catch(err => alert("Error connecting to blockchain. " + err.message));
			setSyncEvents([...synchronisingEvents, newEvent]);			
		}
	}

	function deleteEvent() {
		setOpen(false);
		let deletionsArray = Array.from(synchronisingEvents);
		console.log("125 deletionsArray", deletionsArray);
		for (let i = 0; i < deletionsArray.length; i++) { 
			if (deletionsArray[i].id === activeEventId) { 
				deletionsArray[i].isVisible = false; 
				deletionsArray[i].syncStatus = eventSyncStatus.DELETE; 
			}
		}
		console.log("132 deletionsArray", deletionsArray);
		contractCalStore.removeEvent(activeEventId).catch(err => alert("Error connecting to blockchain. " + err.message));
		setSyncEvents(deletionsArray);
	}
	// Adds item to calendar with drag and drop
	// function handleSelect ({ start, end }) {
	// 	const title = window.prompt('New Event name')
	// 	if (title) {
	// 		var newEvent = {
	// 			start: start,
	// 			end: end,
	// 			title: title,
	// 			desc: title
	// 		}
	// 		setEventsList([...eventsList, newEvent])
	// 		let unixStart = moment(start).unix();
	// 		let unixEnd = moment(end).unix();
	// 		contractCalStore.storeEvent(moment().unix(), unixStart, unixEnd, title, title);
	// 	}
	// }

	const displayClose = () => {
		setOpen(false);
	};

	// function deleteSpecificEvent(eventId) {
	// 	for (let i = 0; i < eventsList.length; i++) { 
	// 		if ( eventsList[i].id === eventId) { 
	// 			eventsList.splice(i, 1); 
	// 		}
	// 	}
	// }

	// const deleteEvent = () => {
	// 	setOpen(false);
	// 	console.log("active UID", activeEventId);
	// 	deleteSpecificEvent(activeEventId);
	// 	contractCalStore.removeEvent(activeEventId).then(
	// 		contractCalStore.getEventsObj(walAddress).then(msg => {
	// 			console.log("delmsg", msg);
	// 			let eventArray = [];
	// 			for (let i = 0; i < msg.length; i++) {
	// 				if (msg[i].uid > 0) {
	// 					let newEvent = {
	// 						id: msg[i].uid.toNumber(),
	// 						allDay: false,
	// 						start: new Date(moment.unix(msg[i].dtstart.toNumber())),
	// 						end: new Date(moment.unix(msg[i].dtend.toNumber())),
	// 						title: msg[i].summary,
	// 						desc: msg[i].description 
	// 					};
	// 					eventArray.push(newEvent);
	// 				}
	// 			}
	// 			setEventsList(eventArray);
	// 		})
	// 	);
	// };

	signer.getAddress()
		.then(response => {
			setWalAddress(response);	
			contractCalStore.getEventsObj(response)
				.then(msg => {
					// Ensures blockchain only loaded if:
					// it exists and
					// has more data than local version
					// Latter condition needed as blockchain not immediate,
					// local version is
					if (msg[0]  && msg.length > eventsList.length) {
						let eventArray = [];
						for (let i = 0; i < msg.length; i++) {
							if (msg[i].uid > 0) {
								let neEvent = {
									id: msg[i].uid.toNumber(),
									allDay: false,
									start: new Date(moment.unix(msg[i].dtstart.toNumber())),
									end: new Date(moment.unix(msg[i].dtend.toNumber())),
									title: msg[i].summary,
									desc: msg[i].description 
								};
								eventArray.push(neEvent);
							}
						}
						setEventsList(eventArray);
					}
				})
		});


	const getBlockchainEvent = (event) => { 
		console.log("Am I triggered???");
			console.log("eventsList:",eventsList.length);
		// contractCalStore.getEventsObj(walAddress)
		// 	.then(msg => {
		// 		let newEvent = {
		// 			id: 0,
		// 			allDay: false,
		// 			start: new Date(moment.unix(msg[0].dtstart.toNumber())),
		// 			end: new Date(moment.unix(msg[0].dtend.toNumber())),
		// 			title: msg[0].description 
		// 		};
		// 		console.log(newEvent);
		// 		setEventsList([...eventsList, newEvent]);
		// 		console.log(eventsList);
		// 	});
		event.preventDefault();
	};

				// console.log(eventsList);


	function displayEvent( event ) {
		setActiveEventId(event.id);
		setActiveEventTitle(event.title);
		setActiveEventDesc(event.desc);
		setActiveEventStart(event.start);
		setActiveEventEnd(event.end);
    setOpen(true);
		console.log(event.id);
	}



		// onSelectEvent={event => alert(event.title)}

	return (
		<main>
		<h1>Forget-me-Block: Ethereum Calendar</h1>
		<div>
		<span>eventsList: </span>
		<Calendar
		selectable
		defaultView="week"
		defaultDate={new Date()}
		localizer={localizer}
		events={visibleEvents}
		startAccessor="start"
		endAccessor="end"
		style={{ height: 500 }}
		onSelectSlot={addEvent}
		onSelectEvent={displayEvent}
		/>
		</div>

		<h2>New event:</h2>
		<form>

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
		<h2>Get Block - To delete</h2>
		<form onSubmit={getBlockchainEvent}>
		<Button variant="contained" color="primary" type="submit">
		Submit
		</Button>

		</form>
		{walAddress === '0x00'
			?
			<p>You have not connected your Ethereum account to this application.  Please do so if you wish to add and read events.</p>
			:
			<>
			<h2>Subscribe to this calendar in your email application:</h2>
			<p>https://ezcontract.hopto.org/api/listen?address={walAddress}</p>
			<p>actually for testing it is:</p>
			<p>http://localhost:3305/listen?address={walAddress}</p>
			<p>Instructions for <a href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-cff1429c-5af6-41ec-a5b4-74f2c278e98c">Outlook</a> and <a href="https://support.mozilla.org/en-US/kb/creating-new-calendars#w_icalendar-ics">Thunderbird</a></p>
			</>
		}
		<div>
      <Dialog
        open={open}
        onClose={displayClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{activeEventTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
{moment(activeEventStart).format("ddd D MMM YY")}<br/>
		{moment(activeEventStart).format("H:mm")} - {moment(activeEventEnd).format("H:mm")}<br/> 
		Description: {activeEventDesc}<br/>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteEvent} color="primary">
            Delete
          </Button>
          <Button onClick={displayClose} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>




		</main>
	);
}

export default App;

	// Refreshes page, calls check for new unlocked data on blockchain
	// useEffect(() => {
	// 	const interval = setInterval(() => {
	// 		setSyncEvents("Hello!!", () => console.log("Hello???", synchronisingEvents));			
	// 		copySynchronisingToVisible();
	// 		// setRefreshTime(moment().add(refreshMinutes, 'minutes').format("HH:mm"));
	// 	}, (refreshMinutes * 60000));
	// 	return () => clearInterval(interval);
	// }, []);
