(function() {
angular.module('angular-subscriptions', []).
    directive('angSubscriptions', function () {
        return {
            restrict: 'AEC',
            scope: {
                appName: '@',
                modelName: '@',
                groupName: '@',
                entityId: '@',
                subscription: '@'
            },
            replace: true,
            controller: function($scope) {  
                if($scope.entityId == "" || $scope.entityId == "0") {
                    $('#id_subscription').hide()
                    $scope.subscription = 'false';
                    return;
                }
                var postData = {
                    app_name: $scope.appName,
                    model_name: $scope.modelName,
                    group_name: $scope.groupName,
                    entity_id : $scope.entityId      
                }
                sparrow.post("/base/check_subscription/", postData, false, function(data){ 
                    $scope.subscription = data.subscription;
                    $scope.$digest();
                });
            },
            link: function (scope, elem, attrs) {
                scope.subscribeItem = function () {        
                    var postData = {
                        app_name: scope.appName,
                        model_name: scope.modelName,
                        group_name: scope.groupName,
                        entity_id: scope.entityId
                    }

                    sparrow.post("/base/subscribe_item/", postData, false, function(data){
                        if(data.code == 0) {
                            sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                            return;
                        }                       
                        scope.subscription = 'true';
                        scope.$digest();
                    },'json', 'appMsg', undefined, undefined, undefined, {'hideLoading': true});                    
                };

                scope.unsubscribeItem = function (commentId) {
                    var postData = {
                        app_name: scope.appName,
                        model_name: scope.modelName,
                        group_name: scope.groupName,
                        entity_id: scope.entityId
                    }
                    sparrow.post("/base/unsubscribe_item/", postData, false, function(data){
                        if(data.code == 0) {
                            sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                            return;
                        }
                        scope.subscription = 'false';
                        scope.$digest();
                    },'json', 'appMsg', undefined, undefined, undefined, {'hideLoading': true});                    
                }
            },
            templateUrl: function(element, attr) {
                return attr.templateUrl || 'angular-subscriptions.html';
            },
        }
    });
})();

angular.module('angular-subscriptions').run(['$templateCache', function($templateCache) {
    'use strict';
    $templateCache.put('angular-subscriptions.html',    
        '<div class="ang-subscription" id="id_subscription">     \
            <span ng-if="subscription == \'false\'"> \
                <a class="follow-link" ng-click="subscribeItem();" title="Get notifications about activity on this order.">\
                    <i class="icon-notification follow-icon"></i>\
                    <span class="follow-text">Follow</span>\
                </a>\
            </span>\
            <span ng-if="subscription == \'true\'">\
                <a class="follow-link" ng-click="unsubscribeItem();" title="Stop getting notifications about activity on this order.">\
                    <i class="icon-notification following-icon"></i>\
                    <span class="following-text">Following</span>\
                </a>\
            </span>\
        </div>'
    );
}]);

// <button class="btn btn-primary" ng-click="subscribeItem();" ng-disabled="btnDisabled">Subscribe</button>
// <button class="btn btn-primary" ng-click="unsubscribeItem();" ng-disabled="btnDisabled">Unsubscribe</button>