function moCostReportInit() {
    var moCostReport = {};

    sparrow.registerCtrl('moCostReportCtrl',function($scope, $rootScope, $route, $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){
        $scope.addViewButtons('');
        $scope.monthChartData = {}
        $scope.quarterChartData = {}
        $scope.yearChartData = {}
        var config = {
            pageTitle: "Production cost"
        }

        $scope.loadReport = function(needChartData) {
            var Dates = $('#dates').text();
            var from_date = '';
            var to_date = ''
            if(Dates != ''){
                var newDates = Dates.split('-');
                from_date = newDates[0].trim();
                to_date =  newDates[1].trim();
                var newToDate = to_date.split('/')
                
                if((parseInt(newToDate[0])+1) < 31){
                    newToDate[0] = (parseInt(newToDate[0])+1).toString();
                    to_date = newToDate.join('/').trim();
                }
            }
            var postData = {
                from_date : from_date,
                to_date : to_date,
                need_chart_data : needChartData
            }
            sparrow.post("/base/load_mo_cost_report/", postData, false, function(data) {
                createGrid(data.rows, data.columns);
                if  (!jQuery.isEmptyObject(data.chartdata)){
                    var yearsdata = data.chartdata.years
                    $scope.quarterChartData = data.chartdata.quarters
                    $scope.yearChartData = data.chartdata.years
                    $scope.monthChartData = data.chartdata.months
                    $scope.crateChart($scope.monthChartData)
                }
            });

        }

        $scope.loadReport(true);
        function createGrid(dataRows, dataColumns){
            $('#dvData').empty();
            var col = [];
            for (var i = 0; i < dataColumns.length; i++) {
                col.push(dataColumns[i]);
            }
            var table = document.createElement("table");
            table.setAttribute("id","dmi_table_data");
            table.setAttribute("class","tablesorter");
            var header = table.createTHead();
            var tr = header.insertRow(-1);              
            for (var i = 0; i < col.length; i++) {
                var th = document.createElement("th");
                th.setAttribute("id",'up-down');
                if (i == 0){
                    th.setAttribute("class",'text-left');
                }
                th.innerHTML = col[i]+'&nbsp;<i class="icon-arrow-1-down">';
                tr.appendChild(th);
            }
            var tbody = table.createTBody();
            for (var i = 0; i < dataRows.length; i++) {
                tr = tbody.insertRow(-1);
                for (var j = 0; j < col.length; j++) {
                    var tabCell = tr.insertCell(-1);
                    
                    if (j == 0 ){
                        tabCell.setAttribute("class",'text-left');
                    }
                    if (dataRows[i][j].length == 1){
                        tabCell.innerHTML = dataRows[i][j]
                    }
                    else{
                        for (var k = 0; k < dataRows[i][j].length ; k++) {
                            if (dataRows[i][j][k] == ''){
                                dataRows[i][j][k] = '-'
                            }
                            if (k % 2 == 0){
                                tabCell.innerHTML = '<div class ="actual">'+dataRows[i][j][k]+'</div';
                            }
                            else{
                                tabCell.innerHTML += '<div class ="estimated">'+dataRows[i][j][k]+'</div';
                            }
                        }    
                    }
                }
            $('#dvData').append(table);
            $("#dmi_table_data").tablesorter();
        }}

        $('#id_show_est').change(function() {
            if($(this).prop("checked") == true){
                $(".estimated").show()
            }
            else{$(".estimated").hide()}
            
           
        });
        
        $scope.calculateCost = function(event) {
            var Dates = $('#dates').text();
            var from_date = '';
            var to_date = ''
            if(Dates != ''){
                var newDates = Dates.split('-');
                from_date = newDates[0].trim();
                to_date =  newDates[1].trim();
                var newToDate = to_date.split('/')
                
                if((parseInt(newToDate[0])+1) < 31){
                    newToDate[0] = (parseInt(newToDate[0])+1).toString();
                    to_date = newToDate.join('/').trim();
                }
            }
            var postData = {
                from_date : from_date,
                to_date : to_date,
                type : 'pre',
            }
            sparrow.post("/base/mo_cost_report/", postData, true, function(data) {
                createGrid(data.rows, data.columns);
            });

        }
        $scope.crateChart = function(finalChartData) {
            var labels = []
            var estdata = []
            var actualdata =[]
            for (var i=finalChartData.length-1 ; i>-1 ; i--){
                    labels.push(finalChartData[i].time_span)
                    estdata.push(finalChartData[i].estimated)
                    actualdata.push(finalChartData[i].actual)
            }
            var ctx = document.getElementById("idProCostChart").getContext('2d');
            var color = Chart.helpers.color;
            prodSummeryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                            label: 'Estimated cost',
                            backgroundColor: color("blue").alpha(0.5).rgbString(),
                            borderColor: "blue",
                            borderWidth: 1,
                            data: estdata
                        
                        },
                        {
                            label: 'Actual cost',
                            backgroundColor: color("red").alpha(0.5).rgbString(),
                            borderColor: "red",
                            borderWidth: 1,
                            data: actualdata
                            
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }]
                    }
                }
            });
        }

        $('input[type=radio][name=chart_type]').change(function() {
            prodSummeryChart.destroy()
            if (this.value == 'months') {
                $scope.crateChart($scope.monthChartData)
            }
            else if (this.value == 'quarters') {
                $scope.crateChart($scope.quarterChartData)
            }
            else if(this.value == 'years'){
                $scope.crateChart($scope.yearChartData)
            }
        });
        

        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);
        
    });

    return moCostReport;
}

var moCostReport = moCostReportInit();