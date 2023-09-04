function currencyrateInit() {
    var currencyrates = {};    
    sparrow.registerCtrl('currencyrateseditCtrl',function($scope, $rootScope, $route, $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){        
        $scope.addViewButtons('');
        config = {
            pageTitle: $routeParams.id == 0 ? "Currency rate":"",
        };

        var baseCurrency = { base_currency : true}

        setAutoLookup('id_currency','/b/lookups/currency/', '', true,false, false, null, 1, baseCurrency);
        $scope.SaveCurrenctRate = function () {
            var factorValue = 0;
            factorValue = ($('#id_factor').val());
            if(factorValue < 0){
                sparrow.showMessage("msg", sparrow.MsgType.Error, "Please enter valid currency factor.", 5);
                return false;
            }
            postData = {
                'id': $routeParams.id, 
            }
            sparrow.postForm(postData, $('#frmCurrencyRate'), $scope, switchEditMode);
        };
        
        function switchEditMode(data){
            if(data.id !=undefined && data.id !='')
            {
                window.location.hash = '#/currencyrate/'+data.id;
            }
        }

        $('#app_container').off('click', 'span.datetime-picker-icon')
        $('#app_container').on('click', 'span.datetime-picker-icon', function() {
            $(this).parent().find('input').trigger('click');
        });

        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);  
        sparrow.pager($scope, $routeParams, true, 'currencyrate','base','#/b/currencyrate/');   
        $scope.reference_date = $('#id_reference_date').val();    
    });

    return currencyrates;
}

var currencyrates = currencyrateInit();