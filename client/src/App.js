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
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const contractAddress ='0x3Cfe9667cAa2E2fD057A729b5affEAB5525C8b48';

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
	const [eventsList, setEventsList] = useState([]);
	const localizer = momentLocalizer(moment);
	const [open, setOpen] = React.useState(false);

	
	// Aborts app if metamask etc not present
	if (noProviderAbort) {
		return (
			<div>
			<h1>Error</h1>
			<p><a href="https://metamask.io">Metamask</a> or equivalent required to access this page.</p>
			</div>
		);
	}

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


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
							let newEvent = {
								id: i,
								allDay: false,
								start: new Date(moment.unix(msg[i].dtstart.toNumber())),
								end: new Date(moment.unix(msg[i].dtend.toNumber())),
								title: msg[i].description 
							};
							eventArray.push(newEvent);
						}
						setEventsList(eventArray);
					}
				})
		});

	// Handles user store message form submit
	const handleNewEvent = (event) => { 
		let unixStart = moment(selectedStartDate).unix();
		let unixEnd = moment(selectedEndDate).unix();
		contractCalStore.storeEvent(moment().unix(), unixStart, unixEnd, event.target.title.value,event.target.description.value);
		event.preventDefault();
	};

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

	// Adds item to calendar with drag and drop
	function handleSelect ({ start, end }) {
		const title = window.prompt('New Event name')
		if (title) {
			var newEvent = {
				start: start,
				end: end,
				title: title 
			}
			setEventsList([...eventsList, newEvent])
			let unixStart = moment(start).unix();
			let unixEnd = moment(end).unix();
			contractCalStore.storeEvent(moment().unix(), unixStart, unixEnd, title, title);
		}
	}




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
		events={eventsList}
		startAccessor="start"
		endAccessor="end"
		style={{ height: 500 }}
		onSelectSlot={handleSelect}
		onSelectEvent={event => alert(event.title)}
		/>
		</div>

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
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open alert dialog
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Use Google's location service?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Let Google help apps determine location. This means sending anonymous location data to
            Google, even when no apps are running.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Disagree
          </Button>
          <Button onClick={handleClose} color="primary" autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>




		</main>
	);
}

export default App;

