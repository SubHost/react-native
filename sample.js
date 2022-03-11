
// -----------------------------------------------------------------------------

// DB .js script


// keep this file independent from api call, reason is because this file only gets
// staff information to display in the main page.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();

	var conn = mysql.createConnection(
	{
		host: process.env.DB_IP,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: process.env.DB_DATABASE,
	});

	conn.connect(err =>
	{
		if(err)
		{
			return err;
		}
	});

	var currentDate = new Date();
	let getOnCallUserQuery = 'get on-call user data';


app.use(cors());


app.get('/db', (req, res) =>
{
	conn.query(getOnCallUserQuery,
		[	// symbol '?' - params
			currentDate.getUTCFullYear(), // year
			currentDate.getUTCMonth() + 1, // month
			currentDate.getUTCDate(), // day
			1 // active
		], function (err, result)
	{ // BEGINNING of query results from On-call schedule
		if(err){
			return res.send(err);
		}else{
			return res.json({
				data: result
			});
		}
	}); // END of query results from On-call schedule
});

app.listen(4000, () => {
	console.log('new page');
})





// -----------------------------------------------------------------------------

// UTR .js script


require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/uptimerobotapi', (req, res) =>
{
	/* uptime robot */
	var Client = require('uptime-robot');
	var cl = new Client(process.env.API_KEY_UPTIME_ROBOT);

	// get list of parameters to add -> https://uptimerobot.com/api
	cl.getMonitors( function (err, apiResults)
	{
		if (err)
		{
			return res.send(err);
		}
		else
		{

			var result_counter = 0;

			for(name in apiResults)
			{	// change status = 8 and 9 to identify as 'monitor down'
				// status '2' is 'monitor up'
				if(apiResults[name].status === '2' || apiResults[name].status === '9')
				{
					result_counter++;
					//	console.log('pass');
					return res.json({
						data: apiResults
					});
				}
			}

			if(result_counter === 0)
			{
				return res.json({
					data: [{
						id: '0',
						friendlyname: ''
					}]
				});
			}

		}
		//console.log(res[0]);

	});
	//process.exit();

});

app.listen(4001, () => {
	console.log('api page');

})




// -----------------------------------------------------------------------------

// main .js script

import React, {useState, useEffect, useRef} from 'react';
import logo from './logo.png';
import './App.css';


import { css } from '@emotion/core';
// First way to import
import { CircleLoader } from 'react-spinners';


class App extends React.Component {

	state = {
		db: [],
		api: [],
		loading: false,
		count: 60,
		delay: 1000
	}

    forceUpdateHandler = () =>
	{
		this.setState({
			db: [],
			api: [],
			loading: true,
			count: 60,
			delay: 1000
		});
		//this.forceUpdate();
		this.getStaff();
		this.getApi();
    };

	componentDidMount(){
		this.getStaff();
		this.getApi();
		this.interval = setInterval(this.tick, this.state.delay);
	}

	componentWillUnmount() {
	  clearInterval(this.interval);
	}

	tick = () => {
	  this.setState({
		count: this.state.count - 1
	  });
	  if(this.state.count == 0){
		  this.forceUpdateHandler();
	  }
	}


	getStaff = _ => {
		fetch('http://localhost:4000/db')
		.then(response => response.json())
		.then(response => this.setState({db: response.data}))
		.catch(err => console.error(err))
	}

	getApi = _ => {
		fetch('http://localhost:4001/uptimerobotapi')
		.then(response => response.json())
		.then(response => this.setState({api: response.data, loading: false}))
		.catch(err => console.error(err))
	}

	// db
	renderStaffName = ({staff_id, staff_name}) => <div class="text" key={staff_id}>{staff_name}</div>
	renderStaffPhone = ({staff_id, cell_number}) => <div class="text" key={staff_id}>{cell_number}</div>

	// api
	renderApiFriendlyName = ({url, friendlyname}) => <a class="apiList" href={url}><div class="apiList">{friendlyname}</div></a>

  render()
  {
	const {db} = this.state;
	const {api} = this.state;

		return(
		<div className="App">
		  <header className="App-header">

		  <div class="banner">
		    <img src={logo} className="App-logo" alt="logo" height="80%" width="32%"/>
			</div>

			<i>{db.map(this.renderStaffName)}</i>
			<br/>
			<i>{db.map(this.renderStaffPhone)}</i>

			<h3>{this.state.count}</h3>

			<br/>

			<button onClick={this.forceUpdateHandler} class="refresh">Force Update</button>

			<br/>

			<div className='sweet-loading'>
			  <CircleLoader
				css={css`display: block;margin: 0 auto;border-color: red;`}
				sizeUnit={"px"}
				size={50}
				color={'#eded17'}
				loading={this.state.loading}
			  />
			</div>

			<code>{api.map(this.renderApiFriendlyName)}</code>

		  </header>

		</div>
		);
	};
}

export default App;
