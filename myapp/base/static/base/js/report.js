function reportsInit(data) {
    var reports = {};
    sparrow.registerCtrl('reportsCtrl',function($scope, $rootScope, $route,  $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){
        $scope.addViewButtons('');
        var rowGrouping = false
        if(data.rowGrouping){
            rowGrouping = data.rowGrouping;
        }
        var config = {
            pageTitle: "",
            listing: [{
                url : "/base/reports_search/"+ $routeParams.id +"/",
                crud: false,
                scrollBody: true,
                reOrder: false,
                rowGrouping : rowGrouping,
                postData: {
                    'is_blank': true,
                    'query_value': ''
                },
                columns: [],
                index: 1,
                onBindCallback: function(){
                    if(config.listing[0]['postData'].is_blank) {
                        $("#id_load_btn").click();
                    }                    
                }
            }]
        }
        var sort = false;
        var columns = JSON.parse(data.columns);
        for(var i = 0; i < columns.length; i++) {
            var column = columns[i];
            var column_name = column.toLowerCase().split(' ').join('_')
            if (data.report_code == 'generic_pr' || data.report_code == 'leave_bal'){
                if(column_name != 'description'){
                    sort = true;
                }
                if(column == 'Sku'){
                    column = 'SKU';  
                }
            } 
            config.listing[0].columns.push({name: column_name, title:column, sort:sort})
            sort = false;
        }

        if(data.report_code == "reorder_st" || data.report_code == 'generic_pr'){
            if (data.report_code == 'generic_pr'){
                sort = true;
            }
            config.listing[0].columns[1] = {name: 'id', title:'ProductId', sort:false, class:"hide-items"}
            config.listing[0].columns[0] = {name: 'product', title:'Product', sort:sort,link: {route:'product', dialog:true, params:{'id':'id', 'title':'product'}, filters:'hide_page=true' }}
        }
        if(data.report_code=='leave_bal' || data.report_code=='prod_cat'){
        var year_range = [
            {'id':'2017', 'name':'2017'},
            {'id':'2018', 'name':'2018'},            
            {'id':'2019', 'name':'2019'},
            {'id':'2020', 'name':'2020'},
            {'id':'2021', 'name':'2021'},
            {'id':'2021', 'name':'2022'},
            {'id':'2021', 'name':'2023'},
        ]

        setAutoLookup('id_date_range', year_range, '');
        setAutoLookup('id_worker', '/b/lookups/labour/', 'worker', true);
        }
       

        function getQueryValue (){
            var year ='';
            var worker_id = null;
            
            if(data.report_code=='leave_bal'){
                year = $('#hid_date_range').val();
                var ms = $('#id_worker').magicSuggest();
                worker_id = ms.getSelection();
            }

            var query_value = {};
            if($('#id_start_datepicker').length != 0){
                dates_values = ($('#dates').text().split('-'));
                query_value['from_date'] = dates_values[0].trim();
                query_value['to_date'] = dates_values[1].trim();
                
                $('.date_range').text('From '+ query_value['from_date']+' to ' +query_value['to_date']);
                query_value['to_date'] = moment(new Date(query_value['to_date'])).add(1,'days').format('MM/DD/YYYY');
            } 
            query_value['year']=year;
            if (worker_id != null){
                if(worker_id.length>0){
                    query_value['worker_id']=worker_id[0].id;    
                }
            }
            
            for(var i in conditions) {
                if(conditions[i].includes('date') == false){
                    if (!query_value[conditions[i]]){
                        query_value[conditions[i]] = $('#id_condition').find("[name='"+conditions[i]+"']").val();
                        if (!query_value[conditions[i]]) {
                            if (conditions[i] != 'worker_id')
                            {                          
                                return;
                            }                            
                        }
                    }
                }    
            }
            return query_value;
        } 
        
        $("#id_load_btn").on('click', function (event) {
            event.preventDefault();
            config.listing[0]['postData'] = {  
                'is_blank': false,
                'query_value': JSON.stringify(getQueryValue())
            }
            $scope.reloadData(1, config.listing[0]);
        });

        $('#btnexport').on('click', function () {
            sparrow.post("/base/create_export_file/", {report_id : $routeParams.id, query_value: JSON.stringify(getQueryValue())}, false, function(data) {
                var fileNmae = data.file_name;
                window.open("/base/export_reports/"+fileNmae+'/','_self');
            });  
        });
        
        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService); 
        
    });
    return reports;
}
