import React, { useState } from 'react';
import './App.css';
import DateFnsUtils from "@date-io/date-fns";
import { Button, TextField } from '@material-ui/core';
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from '@material-ui/pickers';

function App() {
	const [selectedDate, handleDateChange] = useState(new Date());

	// Handles user store message form submit
	const handleStoreMsg = (e: React.FormEvent) => {
		e.preventDefault();
	};
  return (
		<main>
		<h1>Forget-me-Block: Ethereum Calendar</h1>

			<form onSubmit={handleStoreMsg}>

		<div className="block-element">
		<MuiPickersUtilsProvider utils={DateFnsUtils}>	
		<KeyboardDateTimePicker 
		format="yyyy-MM-dd HH:mm"
		ampm="false"
		label="Date to store until:"
		inputVariant="outlined"
		value={selectedDate} onChange={handleDateChange} />
		</MuiPickersUtilsProvider>
		</div>
		<div className="block-element">
		<TextField 
		name="msgToStore" id="outlined-basic" label="Message to store:" variant="outlined" />
		</div>
		<div className="block-element">
		<Button variant="contained" color="primary" type="submit">
		Submit
		</Button>
		</div>
		</form>
		</main>
  );
}

export default App;
