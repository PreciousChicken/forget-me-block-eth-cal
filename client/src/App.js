import React, { useState } from 'react';
import './App.css';
import DateFnsUtils from "@date-io/date-fns";
import { Button, TextField } from '@material-ui/core';
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from '@material-ui/pickers';

function App() {
	const [selectedStartDate, handleStartDateChange] = useState(new Date());
	const [selectedEndDate, handleEndDateChange] = useState(new Date());
	const [eventTitle, setEventTitle] = "";
	const [eventDescription, setEventDescription] = "";

	// Handles user store message form submit
	const handleNewEvent = (e: React.FormEvent) => {
		console.log(selectedStartDate);
		setEventTitle();
		setEventDescription();
		e.preventDefault();
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
          id="outlined-multiline-static"
          label="Description"
		style = {{width: 450}}
          multiline
          rows={4}
          defaultValue=""
          variant="outlined"
        />
		</div>
		<div className="block-element">
		<Button variant="contained" color="primary" type="submit">
		Submit
		</Button>

		</div>
		</form>
		<h2>Generate iCal for import:</h2>
		</main>
	);
}

export default App;
