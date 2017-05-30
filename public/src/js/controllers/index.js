'use strict';

angular.module('insight.system').controller('IndexController',
function($scope, $rootScope, $timeout, moment, getSocket, Blocks, TransactionsByDays) {

	var self = this;
		self.txs = [];
		self.blocks = [];
		self.scrollConfig = {
			autoHideScrollbar: false,
			axis: 'y',
			theme: 'custom',
			advanced: {
				updateOnContentResize: true
			},
			scrollInertia: 0,
			callbacks: {
				onBeforeUpdate: function() {

					var maxHeight = parseInt(window.getComputedStyle(this).maxHeight),
						list = this.getElementsByClassName('scrollList'),
						heightList = list[0].clientHeight;

					if (heightList > maxHeight) {
						
						this.style.height = parseInt(window.getComputedStyle(this).maxHeight) + 'px';
					} else {
						this.style.height = heightList + 'px';
					}
				}
			}
		};
		self.chartOptions = {
			series : [ 'Transactions' ],
			datasetOverride : [{
				yAxisID: 'y-axis-1' ,
				borderColor: '#2e9ad0',
				borderWidth: 1,
				fill: false,
				pointBorderColor: "#2e9ad0",
				pointBackgroundColor: "#2e9ad0",
				pointBorderWidth: 1,
				pointHoverBackgroundColor: "#e75647",
				pointHoverBorderColor: "#e75647",
				pointHoverBorderWidth: 1,
				pointHitRadius: 10,
				pointStyle: 'rect',
				lineTension: 0
			}],
			options : {
				tooltips:{
					backgroundColor: '#2e9ad0',
					titleFontFamily: "SimplonMono",
					titleFontSize: 12,
					titleFontStyle: '500',
					titleFontColor: '#232328',
					bodyFontFamily: "SimplonMono",
					bodyFontSize: 12,
					bodyFontStyle: '400',
					bodyFontColor: '#232328',
					caretSize: 5,
					cornerRadius: 0,
					displayColors: false
				},
				scales: {
					yAxes: [{
						id: 'y-axis-1',
						type: 'linear',
						display: true,
						position: 'left',
						gridLines: {
							color: '#26475b',
							drawBorder: false,
							drawTicks: true,
							offsetGridLines:  true
						},
						ticks: {
							fontColor:'#2e9ad0',
							fontFamily: "SimplonMono",
							fontSize:  14,
							padding: 25,
							stepSize: 500,
							callback: function(value, index, values) {
								return value + ' t';
							}
						}
					}],
					xAxes: [{
						gridLines: {
							color: '#26475b',
							drawBorder: false,
							drawOnChartArea: false,
							drawTicks: true,
							zeroLineColor: '#26475b'
						},
						ticks: {
							fontColor:'#2e9ad0',
							fontSize: 10,
							fontFamily: "SimplonMono"
						}
					}]
				}
			}
		}

	var _getBlocks = function() {

		Blocks.get({
			limit: $rootScope.Constants.BLOCKS_DISPLAYED
		}, function(res) {

			self.blocks = res.blocks;
			self.blocksLength = res.length;
		});
	};

	var _startSocket = function() {

		socket.emit('subscribe', 'inv');
		socket.on('tx', function(tx) {

			tx.createTime = Date.now();
			self.txs.unshift(tx);

			if (self.txs.length > $rootScope.Constants.TRANSACTION_DISPLAYED) {
				
				self.txs.length = $rootScope.Constants.TRANSACTION_DISPLAYED;
			}
		});

		socket.on('block', function() {

			_getBlocks();
		});
	};

	var socket = getSocket($scope);

	socket.on('connect', function() {

		_startSocket();
	});

	self.getListOfTransactions = function(){

		TransactionsByDays.query({},
		function(response){

			while(response.length < $rootScope.Constants.CHART_DAYS){

				response.push({
					date : moment().subtract($rootScope.Constants.CHART_DAYS - ($rootScope.Constants.CHART_DAYS - response.length), 'days').format('YYYY-MM-DD'),
					transaction_count: 0
				});
			}

			self.lastTransactionsList = response.reverse();
			self.chartOptions.labels = self.lastTransactionsList.map(function(it, ind){

				return moment(it.date).format('MM/DD');
			});
			self.chartOptions.data = [ self.lastTransactionsList.map(function(it){

				return it.transaction_count;
			})];
		});
	}

	self.index = function() {

		_getBlocks();
		_startSocket();
	};
});
