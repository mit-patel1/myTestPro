function appSearchInit() {    
    sparrow.registerCtrl('appSearchCtrl',function($scope, $rootScope, $route, $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){
        $scope.addViewButtons('');
        //If search is initiated from the diffrent route 
        $scope.searchParameter = $rootScope.searchParameter;
        var pageTitle = "Search results";
        if ($rootScope.searchFor !== undefined) {
             pageTitle = "Search results for "+$rootScope.searchFor;
        }
       
        var config = {
            pageTitle: pageTitle,
            listing: [{
                index : 98,
                url: "/base/search/",
                paging: false,               
                crud: false,                           
                columns: [
                    { name: 'line1_info1', title: '', sort: false, renderWith: renderSearchRow}        
                ],
                onBindCallback: function() {
                    var emptyTblMsg = 'No data available for search';                    
                     if ($rootScope.searchFor) {                        
                        emptyTblMsg = 'Your search - <b>'+$rootScope.searchFor+'</b> - did not match any records.';
                    }
                    $(".dataTables_empty").html(emptyTblMsg);
                }                
            }]    
        }

        $scope.openIframe = function(appName, modelName, entityId, type){
            related_to = ''
            sparrow.onEditLink(sparrow.getEntityIframeURL(appName, modelName, entityId, related_to , type), 'Order');
        }

        function renderSearchRow(data, type, full, meta) {    
        $scope.appName =  full.app_name
           var template = 
                '<div class="sr-blk">'+                    
                    '<span style="cursor:pointer;color:#6c8ecf" ng-click="openIframe(\''+full.app_name+'\',\''+full.model_name+'\','+full.object_id+',\''+full.type+'\');" class="sr-d1">'+
                        '<div>'+full.line1_info1+'</div>'+
                        '<div>'+full.line1_info2+'</div>'+
                        '<div class="sr-dt">'+full.line1_info3+'</div>'+
                    '</span>'+
                    '<div class="sr-d2">'+full.line2_info1+'</div>'+
                    '<div class="sr-d3">'+full.line3_info1+'</div>'+
                '</div>'

            return template;
        }
        
        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);         
        
    });
}

appSearchInit();        