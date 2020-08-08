import React, { useState, useEffect  } from 'react';
import './App.css';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { Button } from '@material-ui/core';
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
	const localizer = momentLocalizer(moment);
	const [walAddress, setWalAddress] = useState('0x00');
	const [open, setOpen] = useState(false);
	const [activeEventTitle, setActiveEventTitle] = useState("");
	const [activeEventDesc, setActiveEventDesc] = useState("");
	const [activeEventId, setActiveEventId] = useState(0);
	const [activeEventStart, setActiveEventStart] = useState(new Date());
	const [activeEventEnd, setActiveEventEnd] = useState(new Date());
	const [visibleEvents, setVisibleEvents] = useState([]);
	const [synchronisingEvents, setSyncEvents] = useState([]);

	// Updates React with blockchain events and wallet address on page opening
	useEffect(() => {
		let updatedArray = [];
		signer.getAddress()
			.then(response => {
				setWalAddress(response);	
				contractCalStore.getEventsObj(response)
					.then(blockEvents => {
						if (blockEvents[0]) {
							// Synchs events remaining in block only 
							for (let i = 0; i < blockEvents.length; i++) {
								let newEvent = new Event(
									false, 
									new Date(moment.unix(blockEvents[i].dtstart.toNumber())), 
									new Date(moment.unix(blockEvents[i].dtend.toNumber())), 
									blockEvents[i].summary, 
									blockEvents[i].description, 
									blockEvents[i].dtstamp.toNumber());
								newEvent.uid = blockEvents[i].uid;
								updatedArray.push(newEvent);
							}
							setSyncEvents(updatedArray);
						}
					})
			});
	}, []);


	// Copies events from synch to visible depending
	// isVisible flag
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

	// Object representing Event within React
	function Event(allDay, start, end, title, desc, id) {
		this.allDay = allDay;
		this.start = start;
		this.end = end;
		this.title = title;
		this.description = desc;
		this.id = id; // dtstamp in block, not uid
		this.uid = 0; // uid in block
		this.isVisible = true;
	}

	// Adds event when dropped on React calendar
	function addEvent (event) {
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

	// Deletes event when deleted on React calendar
	function deleteEvent() {
		setOpen(false);
		let deletionsArray = Array.from(synchronisingEvents);
		for (let i = 0; i < deletionsArray.length; i++) { 
			if (deletionsArray[i].id === activeEventId) { 
				deletionsArray[i].isVisible = false; 
			}
		}
		setSyncEvents(deletionsArray);
		contractCalStore.removeEvent(activeEventId).catch(err => alert("Error connecting to blockchain. " + err.message));
	}

	// Closes Event display dialog
	function displayClose() {
		setOpen(false);
	}


	// Opens Event display dialog
	function displayEvent( event ) {
		setActiveEventId(event.id);
		setActiveEventTitle(event.title);
		setActiveEventDesc(event.description);
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

