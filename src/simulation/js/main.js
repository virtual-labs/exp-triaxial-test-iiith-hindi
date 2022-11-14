'use strict';

document.addEventListener('DOMContentLoaded', function() {

	const menu = document.getElementById('menu');
	const restartButton = document.getElementById('restart');
	const instrMsg = document.getElementById('procedure-message');

	menu.addEventListener('change', function() { 
		window.clearTimeout(tmHandle); 
		graphClear(testData[testType].graphs); 
		testType = menu.value; 
		restart(); 
	});
	restartButton.addEventListener('click', restart);

	function graphClear(graphs) {
		graphs.forEach((graph, ix) => {
			const plotId = `plot${ix}`;
			document.getElementById(plotId).innerHTML = '';
		});
	};

	function finish(step) {
		if(!finFlag && step === enabled.length - 1)
		{
			finFlag = true;

			logic(testData[testType].tableData, testData[testType].graphs);
			generateTableHead(table, Object.keys(testData[testType].tableData[0]));
			generateTable(table, testData[testType].tableData);

			document.getElementById("main").style.display = 'none';
			document.getElementById("graph").style.display = 'inline-block';

			document.getElementById("apparatus").style.display = 'none';
			document.getElementById("observations").style.width = '40%';
			if(small)
			{
				document.getElementById("observations").style.width = '85%';
			}
		}
	};

	function logic(tableData, graphs)
	{
		let traces = [];
		graphs.forEach((graph, index) => {
			let xVals = [], yVals = [];
			tableData.forEach(function(row, index) {
				xVals.push(row[graph[0]] * graph[4]);
				yVals.push(row[graph[1]] * graph[5]);
			});
			drawGraph([trace(xVals, yVals, 'Graph')], [graph[2], graph[3]], `plot${index}`);
		});
	};

	function limCheck(obj, translate, lim, step)
	{
		if(obj.pos[0] === lim[0])
		{
			translate[0] = 0;
		}

		if(obj.pos[1] === lim[1])
		{
			translate[1] = 0;
		}

		if(translate[0] === 0 && translate[1] === 0)
		{
			return step + 1;
		}

		return step;
	};

	function updatePos(obj, translate)
	{
		obj.pos[0] += translate[0];
		obj.pos[1] += translate[1];
	};

	function canvas_arrow(ctx, fromx, fromy, tox, toy) {
		const headlen = 5, dx = tox - fromx, dy = toy - fromy, angle = Math.atan2(dy, dx);
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
	};

	class rect {
		constructor(height, width, x, y, color) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.color = color; 
		};

		draw(ctx) {
			ctx.fillStyle = this.color;
			ctx.beginPath();
			ctx.rect(this.pos[0], this.pos[1], this.width, this.height);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		};

		heightChange(change, lim) {
			if(this.height === lim)
			{
				return 1;
			}

			this.height += change;
			return 0;
		};
	};

	class multiRect {
		constructor(height, width, x, y, gap, color) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.gap = [...gap];
			this.color = color;
			
			this.arr = [new rect(this.height, this.width, this.pos[0], this.pos[1], color), new rect(this.height, this.width, this.pos[0] + this.gap[0], this.pos[1] + this.height + this.gap[1], color)];
		};

		draw(ctx) {
			this.arr.forEach((elem, ind) => {
				elem.draw(ctx);
			});
		};
	};

	class loader {
		constructor(height, width, radius, x, y) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.marginHoriz = 0.05 * this.height;
			this.cylStart = 0.4 * this.height;
			this.radius = radius;
			this.angle = 0;
			this.drains = false;
			this.arrows = false;
		};

		draw(ctx) {
			const marginVert = 0.1 * this.width, heightVert = 0.90 * this.height, widthVert = 0.05 * this.width, heightHoriz = 0.05 * this.height, gaugeCenterY = 0.25 * this.height, baseWidth = 0.6 * this.width, baseHeight = 0.05 * this.height, pipeWidth = 0.025 * this.width, arrowPad = 10, arrowGap = 20;
			ctx.fillStyle = data.colors.gray;

			ctx.beginPath();
			ctx.rect(this.pos[0] + marginVert, this.pos[1], widthVert, heightVert);
			ctx.rect(this.pos[0] + this.width - marginVert, this.pos[1], -widthVert, heightVert);
			ctx.rect(this.pos[0], this.pos[1] + heightVert, this.width, this.height - heightVert);
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = data.colors.black;
			ctx.beginPath();
			ctx.rect(this.pos[0], this.pos[1] + this.marginHoriz, this.width, heightHoriz);
			ctx.rect(this.pos[0] + this.width / 2 - baseWidth / 2, this.pos[1] + heightVert - baseHeight, baseWidth, baseHeight);
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = data.colors.white;
			ctx.beginPath();
			ctx.arc(this.pos[0] + this.width / 2, this.pos[1] + gaugeCenterY, this.radius, 0, 2 * Math.PI);
			canvas_arrow(ctx, this.pos[0] + this.width / 2, this.pos[1] + gaugeCenterY, this.pos[0] + this.width / 2 + this.radius * Math.sin(this.angle), this.pos[1] + gaugeCenterY - this.radius * Math.cos(this.angle));

			ctx.moveTo(this.pos[0] + this.width / 2, this.pos[1] + gaugeCenterY - this.radius);
			ctx.lineTo(this.pos[0] + this.width / 2, this.pos[1] + this.marginHoriz + heightHoriz);

			ctx.moveTo(this.pos[0] + this.width / 2, this.pos[1] + gaugeCenterY + this.radius);
			ctx.lineTo(this.pos[0] + this.width / 2, this.pos[1] + this.cylStart);
			ctx.fill();
			ctx.stroke();

			if(this.drains)
			{
				ctx.fillStyle = data.colors.lightBlue;
				ctx.beginPath();
				ctx.moveTo(this.pos[0] + this.width / 2, this.pos[1] + heightVert - baseHeight - 10);
				ctx.lineTo(this.pos[0] + this.width / 2, this.pos[1] + heightVert / 2 + this.height / 2 + 10);
				ctx.lineTo(this.pos[0] + this.width + 20, this.pos[1] + heightVert / 2 + this.height / 2 + 10);
				ctx.lineTo(this.pos[0] + this.width + 20, this.pos[1] + heightVert / 2 + this.height / 2 + 10 - pipeWidth);
				ctx.lineTo(this.pos[0] + this.width / 2 + pipeWidth, this.pos[1] + heightVert / 2 + this.height / 2 + 10 - pipeWidth);
				ctx.lineTo(this.pos[0] + this.width / 2 + pipeWidth, this.pos[1] + heightVert - baseHeight - 10);

				ctx.moveTo(this.pos[0] + this.width / 2 - baseWidth / 2 + 30, this.pos[1] + heightVert - baseHeight);
				ctx.lineTo(this.pos[0] + this.width / 2 - baseWidth / 2 + 30, this.pos[1] + heightVert / 2 + this.height / 2 + 10);
				ctx.lineTo(this.pos[0] - 20, this.pos[1] + heightVert / 2 + this.height / 2 + 10);
				ctx.lineTo(this.pos[0] - 20, this.pos[1] + heightVert / 2 + this.height / 2 + 10 - pipeWidth);
				ctx.lineTo(this.pos[0] + this.width / 2 - baseWidth / 2 + 30 - pipeWidth, this.pos[1] + heightVert / 2 + this.height / 2 + 10 - pipeWidth);
				ctx.lineTo(this.pos[0] + this.width / 2 - baseWidth / 2 + 30 - pipeWidth, this.pos[1] + heightVert - baseHeight);
				ctx.stroke();
				ctx.fill();
			}

			ctx.beginPath();
			for(let i = 0; this.arrows && arrowPad + i * arrowGap < baseWidth; i += 1)
			{
				canvas_arrow(ctx, this.pos[0] + this.width / 2 - baseWidth / 2 + arrowPad + i * arrowGap, this.pos[1] + gaugeCenterY + this.radius, this.pos[0] + this.width / 2 - baseWidth / 2 + arrowPad + i * arrowGap, this.pos[1] + this.cylStart - 5);
			}
			ctx.stroke();
		};
	};

	class shearBox {
		constructor(height, width, x, y) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.gap = [0, 0];
		};

		draw(ctx) {
			const margin = 20, handleWidth = 20, stonesHeight = 20;
			new multiRect(this.height / 2, this.width, this.pos[0], this.pos[1], this.gap, data.colors.yellow).draw(ctx);
			new multiRect(stonesHeight, this.width - 2 * margin, this.pos[0] + margin, this.pos[1], [this.gap[0], this.height - 2 * stonesHeight], data.colors.lightBlue).draw(ctx);

			ctx.fillStyle = data.colors.gray;
			ctx.beginPath();
			ctx.moveTo(this.pos[0] + this.width - margin, this.pos[1]);
			ctx.lineTo(this.pos[0] + this.width - margin, this.pos[1] - this.height * 0.5);
			ctx.lineTo(this.pos[0] + 1.6 * this.width - margin, this.pos[1] - this.height * 0.5);
			ctx.lineTo(this.pos[0] + 1.6 * this.width - margin, this.pos[1] + this.height / 2);
			ctx.lineTo(this.pos[0] + 1.6 * this.width - margin - handleWidth, this.pos[1] + this.height / 2);
			ctx.lineTo(this.pos[0] + 1.6 * this.width - margin - handleWidth, this.pos[1] - this.height * 0.5 + handleWidth);
			ctx.lineTo(this.pos[0] + this.width, this.pos[1] - this.height * 0.5 + handleWidth);
			ctx.lineTo(this.pos[0] + this.width, this.pos[1]);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		};

		shear(change) {
			this.gap[0] += change;
		};
	};

	class soil {
		constructor(height, width, x, y) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.stoneHeight = 0.1 * this.height;
		};

		draw(ctx) {
			new rect(this.height - 2 * this.stoneHeight, this.width, this.pos[0], this.pos[1] + this.stoneHeight, data.colors.soilBrown).draw(ctx);
			new multiRect(this.stoneHeight, this.width, this.pos[0], this.pos[1], [0, this.height - 2 * this.stoneHeight], data.colors.lightGray).draw(ctx);
		};

		shear(change) {
			this.soils[this.soils.length - 1].pos[0] += change;
		};
	};

	class chamber {
		constructor(height, width, x, y) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.waterHeight = 0;
			this.topHeight = 0.1 * this.height;
			this.arrows = false;
		};

		draw(ctx) {
			const margin = 0.05 * this.width, gap = 20, arrowLen = 25, pad = 20;
			new rect(this.topHeight, this.width, this.pos[0], this.pos[1], data.colors.black).draw(ctx);
			new rect(this.height - this.topHeight, this.width - 2 * margin, this.pos[0] + margin, this.pos[1] + this.topHeight, data.colors.white).draw(ctx);
			new rect(-this.waterHeight, this.width - 2 * margin, this.pos[0] + margin, this.pos[1] + this.height, data.colors.blue).draw(ctx);

			ctx.fillStyle = data.colors.black;
			ctx.beginPath();
			for(let i = 0; this.arrows && this.topHeight + pad + i * gap < this.height; i += 1)
			{
				canvas_arrow(ctx, this.pos[0] + margin, this.pos[1] + this.topHeight + pad + i * gap, this.pos[0] + margin + arrowLen, this.pos[1] + this.topHeight + pad + i * gap);
				canvas_arrow(ctx, this.pos[0] + this.width - margin, this.pos[1] + this.topHeight + pad + i * gap, this.pos[0] + this.width - margin - arrowLen, this.pos[1] + this.topHeight + pad + i * gap);
			}
			ctx.stroke();
		};

		addWater(change) {
			if(this.waterHeight >= this.height - this.topHeight)
			{
				return 1;
			}

			this.waterHeight += change;
			return 0;
		};
	};

	function trace(Xaxis, Yaxis, name)
	{
		let xVals = [...Xaxis], yVals = [...Yaxis];

		const retTrace = {
			x: xVals,
			y: yVals,
			name: name,
			type: 'scatter',
			mode: 'lines',
		};

		return retTrace;
	};

	function drawGraph(traces, text, id) {
		try {
			const layout = {
				width: 400,
				height: 400,
				xaxis: {
					title: {
						text: text[0],
						font: {
							family: 'Courier New, monospace',
							size: 18,
							color: data.colors.black
						}
					},
				},
				yaxis: {
					title: {
						text: text[1],
						font: {
							family: 'Courier New, monospace',
							size: 18,
							color: data.colors.black
						}
					},
				}
			};

			const config = {responsive: true};
			Plotly.newPlot(id, traces, layout, config);
		}

		catch (err) {
			console.error(err);
			alert(err);
		}
	};

	function init()
	{
		objs = {
			"chamber": new chamber(150, 150, 540, 180),
			"membrane": new rect(110, 80, 575, 215, data.colors.yellow),
			"soil": new soil(120, 60, 585, 210),
			"drainage": "",
			"loader": new loader(330, 270, 20, 480, 50),
		};
		keys = [];

		enabled = [["loader"], ["loader", "soil"], ["loader", "soil", "membrane"], ["loader", "soil", "membrane", "chamber"], ["loader", "soil", "membrane", "chamber", "drainage"], ["loader", "soil", "membrane", "chamber"], ["loader", "soil", "membrane", "chamber"], []];
		step = 0;
		translate = [0, 0];
		lim = [-1, -1];
		arrows = false;
		finFlag = false;
	};

	function restart() 
	{ 
		window.clearTimeout(tmHandle); 

		document.getElementById("main").style.display = 'block';
		document.getElementById("graph").style.display = 'none';
		document.getElementById("apparatus").style.display = 'block';
		document.getElementById("observations").style.width = '';

		table.innerHTML = "";
		init();

		tmHandle = window.setTimeout(draw, 1000 / fps); 
	};

	function generateTableHead(table, data) {
		let thead = table.createTHead();
		let row = thead.insertRow();
		data.forEach(function(key, ind) {
			let th = document.createElement("th");
			th.innerHTML = key;
			row.appendChild(th);
		});
	};

	function generateTable(table, data) {
		data.forEach(function(rowVals, ind) {
			let row = table.insertRow();
			Object.keys(rowVals).forEach(function(key, i) {
				let cell = row.insertCell();
				cell.innerHTML = rowVals[key];
			});
		});
	};

	function check(event, translate, step, flag=true)
	{ 
		if(translate[0] !== 0 || translate[1] !== 0)
		{
			return step;
		}

		const canvasPos = [(canvas.width / canvas.offsetWidth) * (event.pageX - canvas.offsetLeft), (canvas.height / canvas.offsetHeight) * (event.pageY - canvas.offsetTop)];
		const errMargin = 10;

		let hover = false;
		canvas.style.cursor = "default";
		keys.forEach(function(val, ind, arr) {
			if(canvasPos[0] >= objs[val].pos[0] - errMargin && canvasPos[0] <= objs[val].pos[0] + objs[val].width + errMargin && canvasPos[1] >= objs[val].pos[1] - errMargin && canvasPos[1] <= objs[val].pos[1] + objs[val].height + errMargin)
			{
				if(step === 5 && val === "chamber")
				{
					hover = true;
					translate[1] = 1;
				}

				else if(step === 6 && val === "chamber")
				{
					hover = true;
					if(flag)
					{
						arrows = true;
					}
				}
			}
		});

		if(!flag && hover)
		{
			canvas.style.cursor = "pointer";
			translate[0] = 0;
			translate[1] = 0;
			lim[0] = 0;
			lim[1] = 0;
		}

		return step;
	};

	const canvas = document.getElementById("main");
	canvas.width = 840;
	canvas.height = 400;
	canvas.style = "border:3px solid";
	const ctx = canvas.getContext("2d");
	ctx.lineWidth = 3;

	const border = data.colors.black, lineWidth = 3, fps = 150;
	const msgs = [
		"Select the type of test to be conducted from the dropdown menu. Click on 'Axial Loading Device' in the apparatus menu to add a loading device to the workspace.", 
		"Click on 'Soil Sample' in the apparatus menu to add a soil sample to the device base with porous stones on the top and bottom.",
		"Click on 'Membrane' in the apparatus menu to add a membrane around the soil sample.", 
		"Click on 'Cylindrical Chamber' in the apparatus menu to enclose the sample in a cylindrical cell.",
		"Click on 'Drainage' in the apparatus menu to attach drainage pipes to the chamber and sample.",
		"Click on the chamber to fill it with water.",
		"Click on the chamber to start the machine and apply the required forces.",
		"Click the restart button to perform the experiment again.",
	];

	const testData = {
		"UU": {
			"outputs": [
				{
					"LHS": "Initial Sample Length = ",
					"value": 8.94,
					"unit": " cm",
					"step": 2
				},
				{
					"LHS": "Initial Sample Diameter = ",
					"value": 3.58,
					"unit": " cm",
					"step": 2
				},
				{
					"LHS": "Cell Confining Pressure, σ<sub>3</sub> = ",
					"value": 1.05,
					"unit": " kg/cm<sup>2</sup>",
					"step": 6
				},
			],
			"tableData": [
				{ "Sample Deformation (cm)": "0.025", "Vertical Strain": "0.0028", "Proving Ring Reading": "3.5", "Piston Load, P (kg)": "0.583", "Corrected Area, A (cm<sup>2</sup>)": "10.09", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.058" }, 
				{ "Sample Deformation (cm)": "0.076", "Vertical Strain": "0.0085", "Proving Ring Reading": "11", "Piston Load, P (kg)": "1.831", "Corrected Area, A (cm<sup>2</sup>)": "10.148", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.18" }, 
				{ "Sample Deformation (cm)": "0.127", "Vertical Strain": "0.0142", "Proving Ring Reading": "18", "Piston Load, P (kg)": "2.997", "Corrected Area, A (cm<sup>2</sup>)": "10.206", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.294" }, 
				{ "Sample Deformation (cm)": "0.254", "Vertical Strain": "0.0284", "Proving Ring Reading": "31", "Piston Load, P (kg)": "5.161", "Corrected Area, A (cm<sup>2</sup>)": "10.361", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.498" }, 
				{ "Sample Deformation (cm)": "0.457", "Vertical Strain": "0.0511", "Proving Ring Reading": "44", "Piston Load, P (kg)": "7.326", "Corrected Area, A (cm<sup>2</sup>)": "10.606", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.691" }, 
				{ "Sample Deformation (cm)": "0.66", "Vertical Strain": "0.0739", "Proving Ring Reading": "52", "Piston Load, P (kg)": "8.658", "Corrected Area, A (cm<sup>2</sup>)": "10.864", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.797" }, 
				{ "Sample Deformation (cm)": "0.889", "Vertical Strain": "0.0994", "Proving Ring Reading": "52", "Piston Load, P (kg)": "8.658", "Corrected Area, A (cm<sup>2</sup>)": "11.193", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.775" }, 
				{ "Sample Deformation (cm)": "1.143", "Vertical Strain": "0.1278", "Proving Ring Reading": "49", "Piston Load, P (kg)": "8.158", "Corrected Area, A (cm<sup>2</sup>)": "11.541", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)": "0.707" }, 
			],
			"graphs": [["Vertical Strain", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)", "Axial Strain (%)", "Deviatory Stress, P/A (kg/cm<sup>2</sup>)", 100, 1]]
		},
		"CU": {
			"outputs": [
				{
					"LHS": "Initial Sample Length = ",
					"value": 7.62,
					"unit": " cm",
					"step": 2
				},
				{
					"LHS": "Initial Sample Diameter = ",
					"value": 3.57,
					"unit": " cm",
					"step": 2
				},
				{
					"LHS": "Cell Confining Pressure, σ<sub>3</sub> = ",
					"value": 392,
					"unit": " kN/m<sup>2</sup>",
					"step": 6
				},
			],
			"tableData": [
				{ "Sample Deformation (cm)": "0.015", "Vertical Strain": "0.0021", "Proving Ring Reading": "15", "Piston Load, P (N)": "16.07", "Corrected Area, A (cm<sup>2</sup>)": "8.98", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "17.9", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "2.94", "Pore Water Pressure Parameter": "0.164" }, 
				{ "Sample Deformation (cm)": "0.061", "Vertical Strain": "0.0085", "Proving Ring Reading": "135", "Piston Load, P (N)": "144.63", "Corrected Area, A (cm<sup>2</sup>)": "9.04", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "159.99", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "74.56", "Pore Water Pressure Parameter": "0.466" }, 
				{ "Sample Deformation (cm)": "0.114", "Vertical Strain": "0.0158", "Proving Ring Reading": "172", "Piston Load, P (N)": "184.26", "Corrected Area, A (cm<sup>2</sup>)": "9.11", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "202.26", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "111.83", "Pore Water Pressure Parameter": "0.553" }, 
				{ "Sample Deformation (cm)": "0.183", "Vertical Strain": "0.0254", "Proving Ring Reading": "205", "Piston Load, P (N)": "219.62", "Corrected Area, A (cm<sup>2</sup>)": "9.19", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "238.98", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "148.13", "Pore Water Pressure Parameter": "0.62" }, 
				{ "Sample Deformation (cm)": "0.274", "Vertical Strain": "0.0380", "Proving Ring Reading": "236", "Piston Load, P (N)": "252.83", "Corrected Area, A (cm<sup>2</sup>)": "9.31", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "271.57", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "167.75", "Pore Water Pressure Parameter": "0.618" }, 
				{ "Sample Deformation (cm)": "0.427", "Vertical Strain": "0.0592", "Proving Ring Reading": "265", "Piston Load, P (N)": "283.89", "Corrected Area, A (cm<sup>2</sup>)": "9.52", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "298.2", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "176.58", "Pore Water Pressure Parameter": "0.592" }, 
				{ "Sample Deformation (cm)": "0.503", "Vertical Strain": "0.0697", "Proving Ring Reading": "278", "Piston Load, P (N)": "297.82", "Corrected Area, A (cm<sup>2</sup>)": "9.63", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "309.26", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "176.58", "Pore Water Pressure Parameter": "0.57" }, 
				{ "Sample Deformation (cm)": "0.594", "Vertical Strain": "0.0824", "Proving Ring Reading": "287", "Piston Load, P (N)": "307.46", "Corrected Area, A (cm<sup>2</sup>)": "9.76", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "315.02", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "176.58", "Pore Water Pressure Parameter": "0.561" }, 
				{ "Sample Deformation (cm)": "0.726", "Vertical Strain": "0.1007", "Proving Ring Reading": "286", "Piston Load, P (N)": "306.39", "Corrected Area, A (cm<sup>2</sup>)": "9.96", "Deviatory Stress, P/A (kN/m<sup>2</sup>)": "307.62", "Excess Pore Water Pressure (kN/m<sup>2</sup>)": "160.88", "Pore Water Pressure Parameter": "0.523" }, 
			],
			"graphs": [["Vertical Strain", "Deviatory Stress, P/A (kN/m<sup>2</sup>)", "Axial Strain (%)", "Deviatory Stress, P/A (kN/m<sup>2</sup>)", 100, 1], ["Vertical Strain", "Excess Pore Water Pressure (kN/m<sup>2</sup>)", "Axial Strain (%)", "Excess Pore Water Pressure (kN/m<sup>2</sup>)", 100, 1], ["Vertical Strain", "Pore Water Pressure Parameter", "Axial Strain (%)", "Pore Water Pressure Parameter", 100, 1]]
		}
	};

	let testType = "UU";
	let step, translate, lim, objs, keys, enabled, small, arrows, finFlag;
	init();

	const objNames = Object.keys(objs);
	objNames.forEach(function(elem, ind) {
		const obj = document.getElementById(elem);
		obj.addEventListener('click', function(event) {
			if(elem === "drainage")
			{
				objs['loader'].drains = true;
				step += 1;
				return;
			}

			keys.push(elem);
			step += 1;
		});
	});

	canvas.addEventListener('mousemove', function(event) {check(event, translate, step, false);});
	canvas.addEventListener('click', function(event) {
		step = check(event, translate, step);
	});

	const table = document.getElementsByClassName("table")[0];

	function responsiveTable(x) {
		if(x.matches)	// If media query matches
		{ 
			small = true;
			if(step === enabled.length - 1)
			{
				document.getElementById("observations").style.width = '85%';
			}
		} 

		else
		{
			small = false;
			if(step === enabled.length - 1)
			{
				document.getElementById("observations").style.width = '40%';
			}
		}
	};

	let x = window.matchMedia("(max-width: 1023px)");
	responsiveTable(x); // Call listener function at run time
	x.addListener(responsiveTable); // Attach listener function on state changes

	function draw()
	{
		ctx.clearRect(0, 0, canvas.width, canvas.height); 
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		let ctr = 0;
		document.getElementById("main").style.pointerEvents = 'none';

		objNames.forEach(function(name, ind) {
			document.getElementById(name).style.pointerEvents = 'auto';
			if(keys.includes(name) || !(enabled[step].includes(name)))
			{
				document.getElementById(name).style.pointerEvents = 'none';
			}

			if(keys.includes(name)) 
			{
				if(enabled[step].includes(name))
				{
					ctr += 1;
				}
				objs[name].draw(ctx);
			}
		});

		if(ctr === enabled[step].length && !translate[0] && !translate[1])
		{
			document.getElementById("main").style.pointerEvents = 'auto';
		}

		if(arrows)
		{
			objs['chamber'].arrows = true;
			objs['loader'].arrows = true;
			step += 1;
			arrows = false;
		}

		if(translate[0] !== 0 || translate[1] !== 0)
		{
			let temp = step;

			if(step === 5)
			{
				temp += objs['chamber'].addWater(translate[1]);
				if(temp !== step)
				{
					translate[1] = 0;
				}
			}

			step = temp;
		}

		testData[testType].outputs.forEach((observation, idx) => {
			document.getElementById(`output${idx + 1}`).innerHTML = observation.LHS + "____" + observation.unit;
			if(step >= observation.step)
			{
				document.getElementById(`output${idx + 1}`).innerHTML = observation.LHS + observation.value + observation.unit;
			}
		});

		document.getElementById("procedure-message").innerHTML = msgs[step];
		finish(step);
		tmHandle = window.setTimeout(draw, 1000 / fps);
	};

	let tmHandle = window.setTimeout(draw, 1000 / fps);
});
