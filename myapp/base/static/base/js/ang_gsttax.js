(function() {
angular.module('angular-gsttaxs', []).
    directive('angGsttaxs', function () {
        return {
            restrict: 'AEC',
            scope: {                              
                tax_lines: '@',
                gstSameState : '@',
                invoiceId: '@',
                gstDiffrentState : '@',
                currencySymbol : '@',
                gstshiptaxline : '@',
            },
            replace: true,
            controller: function($scope) {                
                
                if($scope.invoiceId === "") {
                    $scope.tax_lines = [];
                    $scope.gstshiptaxline = [];
                    return;
                }
                
                var postData = {
                    invoice_id : $scope.invoiceId     
                }
                sparrow.post("/financial/check_gst_tax/",postData, false, function(data){  
                    $scope.tax_lines = data.tax_lines;
                    $scope.gstSameState = data.gsttax_same_state;
                    $scope.gstDiffrentState = data.gsttax_different_state;
                    $scope.currencySymbol = data.currency_symbol;
                    $scope.gstshiptaxline = data.ship_tax_lines;
                });
            },
            link: function (scope, elem, attrs) {

               
            },
            templateUrl: function(element, attr) {
                return attr.templateUrl || 'angular-gsttaxs.html';
            },
        }
    });
})();

angular.module('angular-gsttaxs').run(['$templateCache', function($templateCache) {
    'use strict';
    $templateCache.put('angular-gsttaxs.html',    
      '<div class="row ang-gsttax">      \
        <div class="gsttax-container">\
            <div ng-if="gstSameState">\
                <div ng-repeat="ship_tax_line in gstshiptaxline">\
                    <div class="col-sm-12 col-md-12 col-lg-12" id="id_ship_sgst" >\
                        <label class="col-sm-7 col-md-7 col-lg-7 text-right">Ship SGST @ {{ship_tax_line.ship_tax_perc}} % on {{ship_tax_line.ship_amount }} :</label>\
                        <label id="id_ship_sgst" class="col-sm-5 col-md-5 col-lg-5 text-right" style="padding-right:24px">\
                        {{ ship_tax_line.ship_cost }} \
                        {{currencySymbol }} </label>\
                    </div>\
                    <div class="col-sm-12 col-md-12 col-lg-12" id ="id_ship_cgst" >\
                        <label class="col-sm-7 col-md-7 col-lg-7 text-right">Ship CGST @ {{ship_tax_line.ship_tax_perc}} % on {{ship_tax_line.ship_amount }} :</label>\
                        <label id="id_ship_cgst" class="col-sm-5 col-md-5 col-lg-5 text-right" style="padding-right:24px">\
                        {{ ship_tax_line.ship_cost }}\
                        {{currencySymbol }} </label>\
                    </div>      \
                </div>\
                <div ng-repeat="tax_line in tax_lines">\
                    <div class="col-sm-12 col-md-12 col-lg-12" id="id_sgst" >\
                        <label class="col-sm-7 col-md-7 col-lg-7 text-right">SGST @ {{tax_line.tax_perc}} % on {{tax_line.amount }} :</label>\
                        <label id="id_sgst" class="col-sm-5 col-md-5 col-lg-5 text-right" style="padding-right:24px">\
                        {{ tax_line.price }} \
                        {{currencySymbol }} </label>\
                    </div>\
                    <div class="col-sm-12 col-md-12 col-lg-12" id ="id_cgst" >\
                        <label class="col-sm-7 col-md-7 col-lg-7 text-right">CGST @ {{tax_line.tax_perc}} % on {{tax_line.amount }} :</label>\
                        <label id="id_cgst" class="col-sm-5 col-md-5 col-lg-5 text-right" style="padding-right:24px">\
                        {{ tax_line.price }}\
                        {{currencySymbol }} </label>\
                    </div>      \
                </div>\
            </div>\
            <div ng-if="gstDiffrentState">\
                <div ng-repeat="ship_tax_line in gstshiptaxline">\
                    <div class="col-sm-12 col-md-12 col-lg-12" id ="is_ship_igst" >\
                        <label class="col-sm-7 col-md-7 col-lg-7 text-right">Ship IGST @ {{ship_tax_line.ship_tax_perc}} % on {{ship_tax_line.ship_amount }} :</label>\
                        <label id="is_ship_igst" class="col-sm-5 col-md-5 col-lg-5 text-right" style="padding-right:24px">\
                        {{ ship_tax_line.ship_cost}}\
                        {{currencySymbol}} </label>\
                    </div> \
                </div>\
                <div ng-repeat="tax_line in tax_lines">\
                    <div class="col-sm-12 col-md-12 col-lg-12" id ="id_igst" >\
                        <label class="col-sm-7 col-md-7 col-lg-7 text-right">IGST @ {{tax_line.tax_perc}} % on {{tax_line.amount }} :</label>\
                        <label id="id_igst" class="col-sm-5 col-md-5 col-lg-5 text-right" style="padding-right:24px">\
                        {{ tax_line.price}}\
                        {{currencySymbol}} </label>\
                    </div> \
                </div>\
            </div>           \
        </div>     \
    </div>'
  );
  
  }]);

