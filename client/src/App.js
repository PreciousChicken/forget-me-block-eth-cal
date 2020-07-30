import React, { useState  } from 'react';
import './App.css';
import DateFnsUtils from "@date-io/date-fns";
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, TextField } from '@material-ui/core';
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from '@material-ui/pickers';
import { ethers } from "ethers";
import CalStore from "./contracts/CalStore.json";

const contractAddress ='0x56f502B6c9C3e78ac021674648e0091CB06c30A7';

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

	// Aborts app if metamask etc not present
	if (noProviderAbort) {
		return (
			<div>
			<h1>Error</h1>
			<p><a href="https://metamask.io">Metamask</a> or equivalent required to access this page.</p>
			</div>
		);
	}

	const notify = () => toast.error("Error: End date must be after start date!");

	signer.getAddress().then(response => {
		setWalAddress(response);
	});

	// Handles user store message form submit
	const handleNewEvent = (event) => { 
		let unixStart = moment(selectedStartDate).unix();
		let unixEnd = moment(selectedEndDate).unix();
		if (unixStart > unixEnd) {
			notify();
		} else {
			contractCalStore.storeEvent(moment().unix(), unixStart, unixEnd, event.target.title.value,event.target.description.value);
		}
		event.preventDefault();
	};

	return (
		<main>
		<h1>Forget-me-Block: Ethereum Calendar</h1>

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
		<ToastContainer />

		</div>
		</form>
		<h2>Subscribe to this calendar in your email application:</h2>

		<p>https://ezcontract.hopto.org/api/listen?address={walAddress}</p>

		<p>Instructions for <a href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-cff1429c-5af6-41ec-a5b4-74f2c278e98c">Outlook</a> and <a href="https://support.mozilla.org/en-US/kb/creating-new-calendars#w_icalendar-ics">Thunderbird</a></p>

		</main>
	);
}

export default App;


		// <p>actually for testing it is:</p>
		// <p>http://localhost:3305/listen?address={walAddress}</p>
