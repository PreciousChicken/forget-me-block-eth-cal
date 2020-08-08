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

const contractAddress ='0x1D294B6964F0555Db93e4A325329A0049f7cba8E';

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
	const [selectedStartDate, handleStartDateChange] = useState(new Date());
	const [selectedEndDate, handleEndDateChange] = useState(new Date());
	const [walAddress, setWalAddress] = useState('0x00');
	const localizer = momentLocalizer(moment);
	const [open, setOpen] = React.useState(false);
	const [activeEventTitle, setActiveEventTitle] = useState("");
	const [activeEventDesc, setActiveEventDesc] = useState("");
	const [activeEventId, setActiveEventId] = useState(0);
	const [activeEventStart, setActiveEventStart] = useState(new Date());
	const [activeEventEnd, setActiveEventEnd] = useState(new Date());
	const [visibleEvents, setVisibleEvents] = useState([]);
	const [synchronisingEvents, setSyncEvents] = useState([]);

	useEffect(() => checkBlockchain(), []);

	function checkBlockchain() {
		let currentArray = Array.from(synchronisingEvents);
		console.log("current Array 145:", currentArray);
		let updatedArray = [];
			signer.getAddress()
				.then(response => {
					setWalAddress(response);	
					contractCalStore.getEventsObj(response)
						.then(blockEvents => {
							if (blockEvents[0]) {
								for (let i = blockEvents.length-1; i >= 0; i--) {
									for (let j = currentArray.length-1; j >= 0; j--) {
										if (blockEvents[i].dtstamp === currentArray[j].id) {
											if (currentArray[j].status !== eventSyncStatus.DELETE) {
												updatedArray.push(currentArray[j]);
												updatedArray[updatedArray.length-1].status = eventSyncStatus.BLOCK;
												updatedArray[updatedArray.length-1].isVisible = true;
												updatedArray[updatedArray.length-1].uid = blockEvents[i].uid.toNumber();
												currentArray.splice(j, 1); 
											}

											blockEvents.splice(i, 1); // Removes all matched events from block
											//TODO: This isn't going to work as in a funny shape!!!
										
										}
									}
								}
								// Synchs events remaining in block only 
								for (let i = 0; i < blockEvents.length; i++) {
									let newEvent = new Event(
										false, 
										new Date(moment.unix(blockEvents[i].dtstart.toNumber())), 
										new Date(moment.unix(blockEvents[i].dtend.toNumber())), 
										blockEvents[i].summary, 
										blockEvents[i].description, 
										eventSyncStatus.BLOCK, 
										blockEvents[i].dtstamp.toNumber());
									newEvent.uid = blockEvents[i].uid;
									updatedArray.push(newEvent);
								}
								// Synchs ADD events remaining in react only 
								for (let i = 0; i < currentArray.length; i++) {
									if (currentArray[i].status === eventSyncStatus.ADD) {
										updatedArray.push(currentArray[i]);
									}
								}
							} else { // blockEvents empty
								for (let j = currentArray.length-1; j >= 0; j--) {
									if (currentArray[j].status === eventSyncStatus.ADD) {
										updatedArray.push(currentArray[j]);
									}
								}
							}
							console.log("Updated Array 196:", updatedArray);
							setSyncEvents(updatedArray);
						})
				});
		}

	useEffect(() => {
		let tempArray = [];
		for (let i = 0; i < synchronisingEvents.length; i++) {
			if (synchronisingEvents[i].isVisible === true) {
				tempArray.push(synchronisingEvents[i]);
			}
		}
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
		BLOCK: 'block', // Exists in blockchain
		ADD: 'add', // Added in React, not yet in blockchain
		DELETE: 'delete', // Deleted in react, not yet deleted from blockchain
	}

	function Event(allDay, start, end, title, desc, syncStatus, id) {
		this.allDay = allDay;
		this.start = start;
		this.end = end;
		this.title = title;
		this.description = desc;
		this.syncStatus = syncStatus;
		this.id = id; // dtstamp in block, not uid
		this.uid = 0; // uid in block
		this.isVisible = true;
	}

	// Handles user store message form submit
	function addEvent (event) {
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
				title,
				eventSyncStatus.ADD,
				moment().unix()
			);
			setSyncEvents([...synchronisingEvents, newEvent]);			
			contractCalStore.storeEvent(
				newEvent.id, 
				unixStart, 
				unixEnd, 
				newEvent.title,
				newEvent.description
			).catch(err => alert("Error connecting to blockchain. " + err.message))
		}
	}

	function deleteEvent() {
		setOpen(false);
		let deletionsArray = Array.from(synchronisingEvents);
		for (let i = 0; i < deletionsArray.length; i++) { 
			if (deletionsArray[i].id === activeEventId) { 
				deletionsArray[i].isVisible = false; 
				deletionsArray[i].syncStatus = eventSyncStatus.DELETE; 
			}
		}
		setSyncEvents(deletionsArray);
		contractCalStore.removeEvent(activeEventId).catch(err => alert("Error connecting to blockchain. " + err.message));
	}

	const displayClose = () => {
		setOpen(false);
	};




	const getBlockchainEvent = (event) => { 
		checkBlockchain();
		event.preventDefault();
	};

	function displayEvent( event ) {
		setActiveEventId(event.id);
		setActiveEventTitle(event.title);
		setActiveEventDesc(event.desc);
		setActiveEventStart(event.start);
		setActiveEventEnd(event.end);
    setOpen(true);
	}

	return (
		<main>
		<h1>Forget-me-Block: Ethereum Calendar</h1>
		<div>
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
