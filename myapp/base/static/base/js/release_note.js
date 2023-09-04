function releaseNoteInit() {
    var releaseNote = {};

    sparrow.registerCtrl('releaseNoteCtrl',function($scope, $rootScope, $route,  $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){        
        $scope.addViewButtons('');
        config = {
            pageTitle: 'Release note',
        }
        var current_version = $('#id_release_note').text();
        sparrow.setStorage('has_release', 'false|'+current_version, 365);    
        $('.has-release').hide(); 

        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);
        sparrow.setParent('');
    });

    return releaseNote;
}

var releaseNote = releaseNoteInit();