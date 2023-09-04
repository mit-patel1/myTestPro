function moInventoryInit() {
    var moInventory = {};
    sparrow.registerCtrl('moInventoryCtrl',function($scope, $rootScope, $route, $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){
        config = {
            pageTitle: 'MO Inventory',
            topActionbar: {
               extra: [{
                    id:"btnExport",                    
                    multiselect : false,
                    function: onExport
                }]
            },
            listing: [{
                index: 1,
                url: "/base/mo_inventory_search/",
                paging: true,
                scrollBody: true,
                postData: {
                        'from_date': "",
                        'to_date': "", 
                    },
                columns: [
                    { name: 'name', title: 'Product'},
                    { name: 'manufacturer__name', title: 'Manufacturer'},
                    { name: 'purchase_qty', title: 'Purchase Qty'},
                    { name: 'po_line__order__supplier__name', title: 'Supplier'},
                    { name: 'supplier_sku', title: 'SKU'},
                    { name: 'unit_price', title: 'Price'},
                    { name: 'total', title: 'Total'},
                    { name: 'disc_price', title: 'Disc. Price',sort:false},
                    { name: 'disc_total_price', title: 'Disc. Total',sort:false},
                    { name: 'discount', title: 'Discount(%)'},
                    { name: 'remarks', title: 'Source Doc',sort:false},
                    { name: 'is_scanned', title: 'Scanned'},
                    { name: 'mo_status', title: 'MO Status',sort:false},
                    {name : 'total_used_qty',title:'Total Used Qty' , sort:false}
                ],    
            }]
            
        }
         $("#load_btn").on('click', function (event) {
            dtBindFunction();
            config.listing[0].postData = $scope.postData;
            $scope.reloadData(1, config.listing[0]);
        });
        function dtBindFunction(){
            from_date = $('#from_date').val();
            to_date = $('#to_date').val();
            if(from_date == undefined){
                from_date = '';
            }
            if(to_date == undefined){
                to_date = '';
            }
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
                'from_date': from_date,
                'to_date': to_date, 
            }
            $scope.postData = postData;
        }

        function onExport(scope){
            event.preventDefault();
            dtBindFunction();
            var postData = $scope.postData;
            var url = '/base/mo_inventory_export?from=' + postData['from_date'] + "&to=" + postData['to_date'];
            window.open(url,'_blank');
        }
        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);
    });

    return moInventory;
}

var moInventory = moInventoryInit();        