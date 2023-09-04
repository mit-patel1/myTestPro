function ReportsInit() {
    var Reports = {};
    sparrow.registerCtrl('modelReportsCtrl',function($scope, $rootScope, $route, $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, $location){   
        $scope.addViewButtons('');
        config = {   
            pageTitle: 'Reports'+' - '+ $routeParams.type,
            listing: [{
                index : 1,
                search: {
                    params: [
                        { key: "report__title__icontains", name: "Report" }]
                },
                url: "/base/search_reports/"+$routeParams.type+"/", 
                postData : {
                    'myReport' : false
                },       
                crud: false,
                scrollBody: true,
                columns: [
                    { name: 'report__title',sort: false,title:'',renderWith: function(data, type, full, meta){
                    var bookmarkColor = "";
                    var glyphiconStar = "glyphicon glyphicon-star-empty";
                    var favreportTitle = "Mark as favourite";
                    if(full.report_fav){
                        bookmarkColor = "color:rgb(17, 116, 218);";    
                        glyphiconStar = "glyphicon glyphicon-star";     
                        favreportTitle = "Remove from favourite";              
                    }
                    return '<i class="'+glyphiconStar+'" style="color:rgb(121, 125, 131);cursor:pointer;'+bookmarkColor+'" title="'+favreportTitle+'" id = "bookmark'+full.report_id+'" ng-click="favreport('+full.report_id+',\''+full.report_fav+'\')"></i>'
                    }},
                    { name: 'report__title', title: 'Report', sort : true,  renderWith: onLink},
                    { name: 'report__descr', title: 'Description', sort: false},
                ],
                index : 1
            }]
        }

        function onLink(data, type, full, meta) {
            if(full.report__url == '' || full.report__url == null){
                return '<a href="#/base/reports/'+full.report_id+'" target="_self">'+data+'</a>';
            }
            else{
                return '<a href="'+full.report__url+'" target="_self">'+data+'</a>';
            }
        }
        
        $('#idMyfavreport').click(function(){
            $('#idAllreport').removeAttr("style");
            $('#idMyfavreport').css('text-decoration' , 'underline');
            config.listing[0]['postData'].myReport =  true ;
            $scope.reloadData(1, config.listing[0]);
        });

        $('#idAllreport').click(function(){
            $('#idMyfavreport').removeAttr("style");
            $('#idAllreport').css('text-decoration' , 'underline');
            config.listing[0]['postData'].myReport =  false ;
            $scope.reloadData(1, config.listing[0]);
        });
       
        $scope.favreport = function(report_id, fav_report) {
            if(fav_report == 'true'){
                sparrow.post("/base/delete_favorite_report/", {report_id : report_id}, false, function(data) { 
                    $scope.reloadData(1);
                });
            }
            else{
                sparrow.post("/base/add_favorite_report/", {report_id : report_id}, false, function(data) { 
                    $('#bookmark'+data.report_id).css('color' , 'rgb(17, 116, 218)');
                    $scope.reloadData(1);
                });
            }
        },

        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config);
    });

    return Reports;
}

var Reports = ReportsInit();