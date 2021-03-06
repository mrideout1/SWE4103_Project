import React, { Fragment, useState, useEffect }  from "react";
import "./StudentHome.css";
import { makeStyles } from "@material-ui/core/styles";
import { Button, DropdownButton, MenuItem} from "react-bootstrap";
import { StateManager } from "../StateManager.js";
import { useHistory } from "react-router-dom";
import { AspNetConnector } from "../AspNetConnector.js";
import Grid from "@material-ui/core/Grid";
import StudentSeat from "../components/StudentSeat.js";
import * as sha512 from "js-sha512";
import { onError } from "../libs/errorLib";
import Legend from "../components/Legend";

export default function StudentHome() {

  const history = useHistory();

	var url_string = window.location.href;
	var url = new URL(url_string);
	let code = url.searchParams.get("code");
	// If there is no student object(not signed in) then return to the homepage
	if(StateManager.getStudent() == null) {
		StateManager.setStudent(JSON.parse(localStorage.getItem('user')));
		if(StateManager.getStudent() == null) {
			if (code == null) {
				history.push("/login");
			}
			else {
				history.push(`/login?code=${code}`);
			}
		}
	}
	if (code != null && StateManager.getStudent() != null) {
		//get class from class code
		var newClass = [{
			"classCode": code
		}]
		var request = AspNetConnector.getClassCode(newClass);
		request.onload = async function() {
			var response = await JSON.parse(request.response);
			var classFromCode = response[0].className;
			// check if student is already enrolled
			var studentInClass = false;
			for (var i=0; i < classListLength; i++) {
				if (classList[i] === classFromCode) {
					studentInClass = true;
				}
			}
			// if valid class code, ask user if they would like to register
			if (classFromCode!=null && !studentInClass) {
				let answer = window.confirm(`Would you like to register for ${classFromCode}?`);
				// if they would like to register, call addClassToStudent
				if (answer) {
					var student = [{
						"classes":[{"className": classFromCode}], 
						"email": StateManager.getStudent().email
					}];
					request = AspNetConnector.addClassToStudent(student);
					request.onload = async function() {
						response = await JSON.parse(request.response);
					}
					window.location.reload(false);
				}
			}
			else if (studentInClass) {
				alert("You are already registered for this class");
			}
			else {
				alert("Invalid registration link.");
			}
		}
		history.push("/StudentHome");
	}

  const [title, setTitle] = useState(StateManager.getSelectedClass());
	const useStyles = makeStyles((theme) => ({
		paper: {
			padding: theme.spacing(1),
			textAlign: "center",
			color: theme.palette.text.secondary,
		},
  }));


	let student = StateManager.getStudent();
	let classList = [];
	let classListLength = 0;
	if(student !== null)
	{
		student = JSON.parse(AspNetConnector.getStudents([StateManager.getStudent()]).response)[0];
		if (student.classes == null) {
			setNoClasses(true);
		}
		else if (student.classes !== null) {
			for(let i = 0; i < student.classes.length; i++){
				classList.push(student.classes[i].className);
				classListLength++;
			}
		}
	}
	const [noClasses, setNoClasses] = useState(classList.length === 0 && StateManager.getClassLayout() === null);

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
				let type = "";
				let name = "";
				let email = "";
				for(let k = 0; k < classDTO.disabledSeats.length; ++k)
				{
					if(classDTO.disabledSeats[k].x === i &&
					classDTO.disabledSeats[k].y === j )
					{
						type = "disabledSeat"
					}
				}
				for(let k = 0; k < classDTO.openSeats.length; ++k)
				{
					if(classDTO.openSeats[k].x === i &&
					classDTO.openSeats[k].y === j )
					{
						type = "open"
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
				for(let k = 0; k < classDTO.reservedSeats.length; ++k)
				{
					if(classDTO.reservedSeats[k].x === i &&
						classDTO.reservedSeats[k].y === j )
					{
						name = classDTO.reservedSeats[k].name;
						email = classDTO.reservedSeats[k].email;
						type = "reserved"
					}
				}
				// Add seat with specified seat type
				cols.push(
					<div key={i} className="StudentSeat">
						<StudentSeat x={i} y={j} seatType={type} email={email} name={name}/>
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

	let emptyLayout = [];
	if (StateManager.getClassLayout() === null){
		if (classList[0] !== null){
			StateManager.setSelectedClass(classList[0]);
			let classLayout = JSON.parse(AspNetConnector.getClasses([{"className": classList[0]}]).response);
			//StateManager.setClassLayout(classLayout[0]);
			if(classLayout[0].response){
				StateManager.setClassLayout(loadLayout(classLayout[0]));
			}
		}
		else {
			alert("Could not load class");
		}
	}

	const [layout, setLayout] = useState(StateManager.getClassLayout() == null ? emptyLayout : StateManager.getClassLayout());

	const handleSelect = (eventKey, event) => {
		StateManager.setSelectedClass(classList[eventKey]);
		setTitle(classList[eventKey]);
        let classLayout = JSON.parse(AspNetConnector.getClasses([{"className": classList[eventKey]}]).response);
		if(classLayout[0].response)
		{
			StateManager.setClassLayout(classLayout[0]);
			setLayout(loadLayout(classLayout[0]));
		}
	}

	const handleSubmit = () => {
		let response = null;

		// check whether the student has already reserved a seat
		let alreadyReservedSeat = false;
		let reservedSeat = null;
		let seats = StateManager.getSeats();
		for(let i = 0; i < seats.length; i++) {
			if(seats[i].seat.state.email === StateManager.getStudent().email) {
				alreadyReservedSeat = true;
				reservedSeat = seats[i];
				break;
			}
		}

		// check whether the user actually selected a seat to reserve
		if(StateManager.getSelectedSeat() === null){
			window.alert("Please select a seat to reserve.");
		} else if(alreadyReservedSeat) {
			if(StateManager.getSelectedSeat().x === reservedSeat.x && StateManager.getSelectedSeat().y === reservedSeat.y) {
				response = window.confirm("Do you really want to unreserve this seat?");
				if(response) {
					AspNetConnector.unReserveSeat([{
						"className": StateManager.getSelectedClass(),
						"seat": {
							"x": StateManager.getSelectedSeat().x,
							"y": StateManager.getSelectedSeat().y
						}
					}]);
				}
			} else {
				window.alert("You have already reserved a seat for this class."); // the student has already reserved a seat
				StateManager.getSelectedSeat().setState({seatType: StateManager.getSelectedSeat().state.original}); // change color of clicked seat back to unreserved
				StateManager.setSelectedSeat(null);
			}
		} else {
			response = window.confirm("Do you really want to reserve this seat?");

			if (response) {
				try {
					AspNetConnector.reserveSeat([{
						"className": StateManager.getSelectedClass(),
						"seat": {
							"x": StateManager.getSelectedSeat().x,
							"y": StateManager.getSelectedSeat().y,
							"email": StateManager.getStudent().email
						}
					}]);
					window.location.reload(false);
				} catch (e) {

				}
			}
		}
	   
		
        
	}
	const handleRemove = () =>
	{
		if(StateManager.getSelectedClass() !== null && StateManager.getSelectedClass() !== "--") {
			let test = StateManager.getStudent();
			var currentClass = [{"className": StateManager.getSelectedClass()}];
			if(test !== null){
				test = JSON.parse(AspNetConnector.getStudents([StateManager.getStudent()]).response)[0];
				if (test.classes == null) {
					setNoClasses(true);
				}
				else if (test.classes !== null) {
					test.classes = currentClass;
				}
			}

			AspNetConnector.removeClassFromStudent([test]);

			if (test.classes.length === 0 ){
				setNoClasses(true)
			    StateManager.setSelectedClass("--");
			    setTitle("--");
			}
			window.location.reload(false);
		}
		else 
			alert("Please select a class!")
	}

  return (
    <div className="StudentHome">
      <div className="layoutHeader">
	  <h4 style={{marginLeft: '15px'}}>Hello {student.name}!</h4>
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
          <Button onClick={handleSubmit} className="pull-right" variant="light">Submit</Button>
      </div>
	  	{!noClasses && (
			<div>
				<div className="main">
				<Fragment>{layout}</Fragment>
				<Legend/>
				</div>
				<Button onClick={handleRemove} className="removeClass" variant="light">Remove Class</Button>
			</div>
          )}
        {noClasses && (
            <div key="root" className="root">
            <h1 style= {{textAlign: 'center', padding: '50px' }}> There are no classes to display </h1>
        </div> 
        )}
    </div>
  );
}
