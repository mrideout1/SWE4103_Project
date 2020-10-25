
export var StateManager = {
    exampleData: null,
		x: 0,
		y: 0,
		numRows: 0,
		numCols: 0,
		seats: [],
    setExampleData(data) {
        this.exampleData = data;
    },
    getExampleData() {
        return this.exampleData;
    },
	addSeat(x, y, seatType, seat) {
		this.seats.push({"seatType": seatType, "x": x, "y": y, "seat": seat});

		if(this.seats.length > this.numCols * this.numRows)
			this.seats.pop(this.numCols * this.numRows);
	},
	changeSeatType(x, y, seatType) {
		var seatLoc = y * this.numCols + x; 
		this.seats[seatLoc].seatType = seatType;
	},
	getSeat(x,y) {
		console.log("Seats");
		console.log(this.seats);
		for (var i=0; i<=this.seats.length; i++) {
			if (this.seats[i].x === x && this.seats[i].y === y)
				return this.seats[i].seat
		}
	},
	wipeSeats()
	{
		this.seats = []
		this.x = 0;
		this.y = 0;
	},
	getX() {
		return this.x;
	},
	incX() {
		if(this.x === this.numCols - 1) {
			this.x = 0;
			this.y += 1;
		}
		else 
			this.x += 1;
	},
	getY() {
		return this.y;
	},
	setRows(numRows) {
		this.numRows = numRows;
	},
	setCols(numCols) {
		this.numCols = numCols;
	},
	getSeats() {
		return this.seats;
	}
}
