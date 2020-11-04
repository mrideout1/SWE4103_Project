import React, { Fragment, useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button, Dropdown, DropdownButton, MenuItem} from "react-bootstrap";
import { AspNetConnector } from "../AspNetConnector.js";
import Grid from "@material-ui/core/Grid";
import "./InstructorHome.css";
import { StateManager } from "../StateManager.js";
import Seat from "../components/Seat.js";
import { useHistory } from "react-router-dom";
import { TextField } from "@material-ui/core";

export default function InstructorHome() {

	const history = useHistory();

	// If there is no prof object(not signed in) then return to the homepage
	if(StateManager.getProf() == null)
	{
		StateManager.setProf(JSON.parse(localStorage.getItem('user')));
		if(StateManager.getProf() == null)
		{
			history.push("/");
		}
	}

	const cs = AspNetConnector.getAllClasses();
	const [title, setTitle] = useState("--");
	const useStyles = makeStyles((theme) => ({
		paper: {
			padding: theme.spacing(1),
			textAlign: "center",
			color: theme.palette.text.secondary,
		},
	}));

	const createLayout = (numRows, numCols) => {
		StateManager.wipeSeats();
		StateManager.setRows(numRows);
		StateManager.setCols(numCols);

    let layout = [];
    let rows = [];

    for (var j = 0; j < numRows; j++) {

		let cols = [];
		for (var i = 0; i < numCols; i++) {
			cols.push(
			<div key={i} className="seat">
				<Seat key={i} x={i} y={j} />
			</div>
			);
		}
		
		rows.push(
			<Grid item key={j} className="row" col={j} xs={12}>
				{cols}
			</Grid>
		);
    }

    layout.push(
	<div key="root" className="root">
        <Grid container spacing={3}>
			{rows}
        </Grid>
	</div>
    );
    return layout;
	};

	const classes = useStyles();
	const [layout, setLayout] = useState(StateManager.getClassLayout() == null ? createLayout(5,5) : StateManager.getClassLayout());
	
	const loadLayout = (classDTO) => {
		StateManager.wipeSeats();
		StateManager.setRows(classDTO.height);
		StateManager.setCols(classDTO.width);

		let layout = [];
		let rows = [];

		for (var j = 0; j < classDTO.height; j++) {

			let cols = [];
			for (var i = 0; i < classDTO.width; i++) {

				// Find type of seat from classDTO
				let type = ""
				for(let k = 0; k < classDTO.disabledSeats.length; ++k)
				{
					if(classDTO.disabledSeats[k].x === i &&
					classDTO.disabledSeats[k].y === j )
					{
						type = "disabled"
					}
				}
				for(let k = 0; k < classDTO.reservedSeats.length; ++k)
				{
					if(classDTO.reservedSeats[k].x === i &&
						classDTO.reservedSeats[k].y === j )
					{
						type = "reserved"
					}
				}
				for(let k = 0; k < classDTO.accessibleSeats.length; ++k)
				{
					if(classDTO.accessibleSeats[k].x === i &&
						classDTO.accessibleSeats[k].y === j )
					{
						type = "accessible"
					}
				}
				// Add seat with specified seat type
				cols.push(
					<div key={i} className="seat">
						<Seat x={i} y={j} seatType={type}/>
					</div>
						);
			}
			
			rows.push(
				<Grid item className="row" key={j} col={j} xs={12}>
					{cols}
				</Grid>
			);
		}

		layout.push(
		<div key="root" className="root">
			<Grid container spacing={3}>
				{rows}
			</Grid>
		</div>
    );
    return layout;
	};

	const makeClass = () => {
		if(title == "--")
		{
			return;
		}
		var cols = layout[0].props.children.props.children[0].props.children.length;
		var rows = layout[0].props.children.props.children.length;
		var className = title;
		var newClass = [{"className": className, "height": cols, "width": rows}];
		AspNetConnector.makeClass(newClass);
		AspNetConnector.profAddClass([{"email": StateManager.getProf().email, "classes" : [{"className": title}]}]);
		addSeats();
	}
	
	const addSeats = () => {
		var currentLayout = StateManager.getSeats();
		AspNetConnector.wipeSeats([{"className": title}]);

		for( var i=0; i<currentLayout.length; i++){
			let classDTO = [{
				"className": title,
				"seat": null
			}]

			if(currentLayout[i].seatType === "reserved"){
				var reservedSeat = {"x": currentLayout[i].x, "y": currentLayout[i].y}
				classDTO[0].seat = reservedSeat;

				AspNetConnector.reserveSeat(classDTO);
			}
			else if(currentLayout[i].seatType === "disabled"){
				var disabledSeat = {"x": currentLayout[i].x, "y": currentLayout[i].y}
				classDTO[0].seat = disabledSeat;

				AspNetConnector.disableSeat(classDTO);
			}
			else if(currentLayout[i].seatType === "accessible"){
				var accessibleSeat = {"x": currentLayout[i].x, "y": currentLayout[i].y};
				classDTO[0].seat = accessibleSeat;

				AspNetConnector.makeSeatAccessible(classDTO);
			}
		}
	}

	let classList = JSON.parse(AspNetConnector.profGetClasses([StateManager.getProf()]).response);
	const handleSelect = (eventKey, event) => {
		StateManager.setSelectedClass(classList[eventKey]);
		setTitle(classList[eventKey]);
		let classLayout = JSON.parse(AspNetConnector.getClasses([{"className": classList[eventKey]}]).response);
		if(classLayout[0].response)
		{
			StateManager.setClassLayout(classLayout[0]);
			console.log(StateManager.getClassLayout());
			setLayout(loadLayout(classLayout[0]));
		}
		console.log(StateManager.getSeats());
	}
	const newClass = () =>
	{
		let name = prompt("New Class Name");
		
		for(let i = 0; i < cs.length; ++i)
		{
			if(cs[i] === name)
			{
				alert("Class already exists");
				return;
			}
		}
		setLayout(createLayout(5,5));
		StateManager.setSelectedClass(name);
		setTitle(name);
	}

	function directToEditSeatPlanPage() {
		history.push("/EditSeatPlan");
	}

	const generateLink = () => {
		//let link = AspNetConnector.generateLink(StateManager.getSelectedClass);
		document.getElementById("link-field").value="Hello";
	}

return (
    <div>
		<div className="layoutHeader">
			<div style={{width: "100%"}}>
				<DropdownButton 
					title={StateManager.getSelectedClass()}
					id="classDropdown"
					onSelect={handleSelect.bind(this)}>
					{classList.map((opt, i) => (
						<MenuItem key={i} eventKey={i}>
							{opt}
						</MenuItem>
					))}
				</DropdownButton>
				<div style={{width: "15px", height: "auto", display: "inline-block"}}/>
				<Button onClick={newClass} variant="light">Add</Button>
				<Button onClick={makeClass} variant="light" className="pull-right">Submit</Button>
			</div>
		</div>
		<Fragment>{layout}</Fragment>
		<div className="layoutFooter">
			<Button onClick={directToEditSeatPlanPage} variant="light">Edit Seat Plan</Button>
			<Button variant="light">More Options...</Button>
		</div>
		<div className="link">
			<TextField
			className="link"
			id="link-field"
			defaultValue=""
			InputProps={{
				readOnly: true,
			}}
			variant="outlined"
			/>
			<Button className="link" onClick={generateLink} variant="light">Geneate Link</Button>
		</div>
    </div>
);
}
