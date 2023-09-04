function currencyrateInit() {
    var currencyrates = {};

    sparrow.registerCtrl('currencyratesCtrl',function($scope, $rootScope, $route,  $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){        
        config = {
            pageTitle: "Exchange rate",
            topActionbar: {
                delete: {
                    url: "/base/del_currencyrates/"
                },
                extra: [{
                    id: "btnAddCurrencyRate",
                    function: onAddCurrencyRate,

                },{
                    id: "btnEditCurrencyRate",
                    function: function() {
                        var selectedId = $scope.getSelectedIds(1).join([separator = ',']);
                        $scope.oneditCurrencyRate(selectedId);
                    },
                    multiselect: false
                }]
            },
             listing: [{
                index : 1,
                search: {
                    params: [
                        { key: "currency__name__icontains", name: "Currency"},
                        { key: "reference_date__icontains", name: "Reference date"},
                        { key: "expire_date__icontains", name: "Expiry date"},
                    ]
                },                
                url: "/b/currencyrate_search/",                                
                crud: true,      
                scrollBody: true,          
                columns: [                    
                    { name:'currency', title: 'Currency', renderWith: function(data, type, full, meta) { 
                        return '<a style="cursor:pointer;" ng-click="oneditCurrencyRate('+full.id+');" >'+data+'</a>';
                    }},
                    { name: 'factor', title: 'Currency factor'},
                    { name: 'reference_date', title: 'Reference date'},
                    { name: 'expire_date', title: 'Expire on'}                
                ]
            }]
        }


        function onAddCurrencyRate() {
            selectedCurrencyRateId = 0;
            $('#currencyRateLable').text("Add exchange rate");
            $scope.showCurrencyRate(0);
        }

        $scope.oneditCurrencyRate = function(currencyrateId) {
            selectedCurrencyRateId = currencyrateId;
            $('#currencyRateLable').text("Edit exchange rate");
            $scope.showCurrencyRate(selectedCurrencyRateId);
        }

        $scope.showCurrencyRate = function(currencyrateId) {
            sparrow.post("/base/get_currencyrate/", {id:currencyrateId}, false, function(data) {
                $('#currencyRatebody').html(data);
                $('#currencyRateModel').modal('show');
                var baseCurrency = { base_currency : true}
                setAutoLookup('id_currency','/b/lookups/currency/', '', true,false, false, null, 1, baseCurrency);
            }, 'html');
        };

        $scope.saveCurrenctRate = function (event) {
            event.preventDefault();
            currency = $('#hid_currency').val();
            if(currency == undefined){
                sparrow.showMessage("msg", sparrow.MsgType.Error, "Please select currency.", 5);
                return false;
            }
            postData = {
                'id': selectedCurrencyRateId, 
            }

            if($('#frmCurrencyRate').valid()){
                sparrow.postForm(postData, $('#frmCurrencyRate'), $scope, switchEditMode);
            }
        };

        function switchEditMode(data){
            if(data.code == 1){
                $('#currencyRateModel').modal('hide');
                $scope.reloadData(1);
            }
        }

        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);

    });

    return currencyrates;
}

var currencyrates = currencyrateInit();