function sysparameterInit() {
    var sysparameters = {};

    sparrow.registerCtrl('sysparametersCtrl',function($scope, $rootScope, $route,  $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){        
        config = {
            pageTitle: "System parameters",
            topActionbar: {
               add: {
                    url: "/#/sysparameter/"
               },
               edit: {
                    url: "/#/sysparameter/"
               },
            },
             listing: [{
                index : 1,
                search: {
                    params: [
                        { key: "para_code__icontains", name: "Parameter code" },
                        { key: "descr__icontains", name: "Description"},
                        { key: "para_value__icontains", name: "Parameter value"},
                        { key: "para_group__icontains", name: "Parameter group"},
                    ]
                },                
                url: "/b/sysparameter_search/",                                
                crud: true,  
                scrollBody: true,              
                columns: [                    
                    { name: 'id', title: 'ID'},
                    { name: 'para_code', title: 'Parameter code',  link: {route:'systemparameter', params:{'id':'id'}}},
                    { name: 'descr', title: 'Description'},
                    { name: 'para_value', title: 'Parameter value'},
                    { name: 'para_group', title: 'Parameter group'},

                ]
            }]
        }

        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);


    });

    return sysparameters;
}

var sysparameters = sysparameterInit();