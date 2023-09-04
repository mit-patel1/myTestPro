function initSparrow() {
  var controllerProvider = null;

  var app = angular.module('sparrow', [
      'ngRoute',
      'datatables',
      'ui.bootstrap',
      'angular-advanced-searchbox',
      'angularModalService',
      'ngSanitize',
      'angular-comments',
      'angular-tasks',
      'angular-attachments',
      'angular-subscriptions',
      'ngFileUpload'
  ]).controller("mainController", mainController);

    angular.module('sparrow').filter('moment', function () {
      return function (input, momentFn /*, param1, param2, ...param n */) {
        var args = Array.prototype.slice.call(arguments, 2),
            momentObj = moment(input);
        return momentObj[momentFn].apply(momentObj, args);
      };
    });

  setAutoLookup = function(id, data, basename, required, changeEvent, storeInstance, beforeSend, maxSelection, filter, lookupItem, selectionCallback, options) {
    required = required || false;
    changeEvent = changeEvent || false;
    storeInstance = storeInstance || false;
    beforeSend = beforeSend || null;
    maxSelection = maxSelection || 1;
    filter = filter || null;
    lookupItem = lookupItem || null;
    selectionCallback = selectionCallback || null;
    maxSuggestions = options && options.maxSuggestions || 10;
    var baseval = '';
    var selectedId = null;

    if($('#'+id).val() == '[None]')
    {
      $('#'+id).removeAttr('value');
    }
    selectedId = $('#'+id).val().replace('[','').replace(']','');
    var dataUrlParams = {id: selectedId,'options':options}

    if(filter != null) {
      dataUrlParams['filter'] = JSON.stringify(filter)
    }

    var magicOptions = {
      allowFreeEntries: false,
      maxSelection: maxSelection,
      data: data,
      beforeSend: beforeSend,
      valueField: 'id',
      disabledField: 'disabled',
      dataUrlParams: dataUrlParams,
      config:options,
      maxSuggestions: maxSuggestions,
      inputCfg: {"class":"actual-input-box"},
      selectionRenderer: function(data){
        if(selectionCallback){
          selectionCallback(data);
        }
        return data.name;
      },
    }

    if(options && options.renderer){
      magicOptions['renderer'] = options.renderer;
    }

    var ms = $('#'+id).magicSuggest(magicOptions);

    if(storeInstance){
        var autoSuggests = app.global.get(app.global.keys.AUTO_SUGGEST) == undefined ?  {} : app.global.get(app.global.keys.AUTO_SUGGEST);
        autoSuggests[id+'_auto_suggest'] = ms;
        app.global.set(app.global.keys.AUTO_SUGGEST, autoSuggests);
    }

    if(required){
      $(ms.input).parent().append('<input type="text" class="" id="'+id+'-required" name="'+id+'-required" required="required" data-msg-required=" " style="visibility:hidden; display:none;">');
    }
    if(changeEvent){
      $(ms.input).attr('has-change-event','true');
    }

    $(ms).on('focus', function(){
      // var setDataUrlParams = {bid:eval($("#h"+basename).val())}
      selectedName = ms.getSelection().length > 0 && ms.getSelection()[0]['name'] || '';
      var setDataUrlParams = {bid:eval($("#h"+basename).val()),selectedname:selectedName,'options':options}
      var lookUpDataId = '';
      if(basename){
        getdataFullObject = $("#"+basename).magicSuggest().getSelection()
        for (var i = 0; i < getdataFullObject.length; i++) {
            lookUpDataId += getdataFullObject[i].id + ",";
          }
      }
      var setDataUrlParams = {bid:eval($("#h"+basename).val()) , multiplebID:lookUpDataId,selectedname:selectedName,'options':options}
      if(filter != null) {
        setDataUrlParams['filter'] = JSON.stringify(filter)
      }
      ms.setDataUrlParams(setDataUrlParams);
      ms.expand();
      $('#'+id).addClass('ms-ctn-focus');
    });


    $(ms).on('selectionchange', function(e,m){
      selectedName = ms.getSelection().length > 0 && ms.getSelection()[0]['name'] || '';
      // var setDataUrlParams = {selectedname:selectedName,'options':options}
      var setDataUrlParams = {bid:eval($("#h"+basename).val()),selectedname:selectedName,'options':options}
      var lookUpDataId = '';
      if(basename){
        getdataFullObject = $("#"+basename).magicSuggest().getSelection()
        for (var i = 0; i < getdataFullObject.length; i++) {
            lookUpDataId += getdataFullObject[i].id + ",";
          }
      }
      var setDataUrlParams = {bid:eval($("#h"+basename).val()),multiplebID:lookUpDataId,selectedname:selectedName,'options':options}
      if(filter != null) {
        setDataUrlParams['filter'] = JSON.stringify(filter)
      }
      ms.setDataUrlParams(setDataUrlParams);

      if($(ms.input).attr('has-change-event') == 'true'){
        eval($("#h"+id).trigger('change'));
      }
      var requiredField = $(ms.input).parent().parent().attr('id');
      if($('#'+requiredField+'-required').length > 0){
        eval($(ms.input).closest('div.form-group').removeClass('has-error'));
        eval($('#'+id+'-required').val($("#h"+id).val()));
      }

      if (options && options.selectionChanged) {
        return options.selectionChanged(this.getSelection());
      }
      if (options && options.onClick) {
        return options.onClick;
      }
    });

    $('#'+id).off('addNewLink')
    $('#'+id).on('addNewLink', function(e,data){
      if(data['dataUrl']) {
        var openIframeDialog = openIframe("/b/iframe_index/"+data['dataUrl'], data['title'], function(dataObject){
          var isUpdate = true;
          //Remarks: If basename is exist then key(as basename) and value(related id) compulsory pass in data.
          if(dataObject != undefined && basename != '' && (($('#h'+basename).val() != undefined && parseInt($('#h'+basename).val()) != dataObject[basename]) || ($('#h'+basename).val() == undefined))) {
              isUpdate = false;
          }
          if(dataObject != undefined && isUpdate && dataObject['id'] != 0) {
            ms.clear();
            ms.setSelection([dataObject]);
            eval($(ms.input).closest('div.form-group').removeClass('has-error'));
            $('#appMsg').hide();
          }
      });
        parent.globalIndex.iframeCloseCallback.push(openIframeDialog)
      }
      if(data["onclick"]) {
        data["onclick"]();
      }

      ms.collapse();

    });

    $('#'+id+'_lookup_link').click(function() {
      if($(this).attr('data-id') != undefined) {
        $('#'+id+'_lookup_link').attr('href', $(this).attr('data-id'))
      }
    })

    return ms;
  };

  var tIndex = 0;

  app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
  });

  app.pager = function($scope, $routeParams, showPager, modelName, appName, route){
      if($routeParams.id == 0){
          showPager = false;
      }
      if(!(app.getQueryStringParams('hide_page') == undefined)){
          showPager = false;
      }
      if(showPager){
          $('#top_action_bar').append('<div class="btn-group btn-group-sm" style="float: right; margin-right: 5px; margin-top: 7px;"><a class="btn btn-default icon-arrow-1-left paginate_button pager-button" data-pager="previous"></a><a class="btn btn-default icon-arrow-1-right paginate_button pager-button" data-pager="next"></a></div>');
          app.global.set(app.global.keys.PAGER_MODEL_NAME, modelName);
          app.global.set(app.global.keys.PAGER_ID, $routeParams.id);
          app.global.set(app.global.keys.PAGER_APP_NAME, appName);
          app.global.set(app.global.keys.PAGER_ROUTE, route);
      }
  }

  app.get = function(url, callback) {
    $.ajax({
      dataType: "json",
      type: "GET",
      url: url,
      beforeSend: function() {
        $('#loading-image').show();
      },
      complete: function() {
        $('#loading-image').hide();
      },
      success: function(data) {
        success = data.code == 0 ? false : true;
        callback(data, success);
      },
      error: function(data) {
        callback({
          msg: "Error occurred"
        }, false);
        console.log(data);
      }
    });
  };

  app.removeStorage = function(key) {
    try {
        localStorage.removeItem(key);
        localStorage.removeItem(key + '_expiresIn');
    } catch(e) {
        console.log('removeStorage: Error removing key ['+ key + '] from localStorage: ' + JSON.stringify(e) );
        return false;
    }
    return true;
  };

  app.onEditLink = function(url, title, dialogCloseCallback, hasDomain, tableIndex,is_reload) {
    hasDomain = hasDomain || false;
    var openIframeDialog = openIframe(url, title, dialogCloseCallback, hasDomain, tableIndex, null);
    parent.globalIndex.iframeCloseCallback.push(openIframeDialog);
  }

  app.getStorage = function(key) {

    var now = Date.now();  //epoch time, lets deal only with integer
    // set expiration for storage
    var expiresIn = localStorage.getItem(key+'_expiresIn');
    if (expiresIn===undefined || expiresIn===null) { expiresIn = 0; }

    if (expiresIn < now) {// Expired
        app.removeStorage(key);
        return null;
    } else {
        try {
            var value = localStorage.getItem(key);
            return value;
        } catch(e) {
            console.log('getStorage: Error reading key ['+ key + '] from localStorage: ' + JSON.stringify(e) );
            return null;
        }
    }
  };

  app.setStorage = function(key, value, expires) {

    if (expires===undefined || expires===null) {
        expires = (24*60*60*30);  // default: for 30 day
    } else {
        expires = 24*60*60*(Math.abs(expires)); //make sure it's positive
    }

    var now = Date.now();  //millisecs since epoch time, lets deal only with integer
    var schedule = now + expires*1000;
    try {
        localStorage.setItem(key, value);
        localStorage.setItem(key + '_expiresIn', schedule);
    } catch(e) {
        console.log('setStorage: Error setting key ['+ key + '] in localStorage: ' + JSON.stringify(e) );
        return false;
    }
    return true;
  };

  app.setCookie = function(name,value,days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  app.getCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  };

  app.deleteCookie = function(name) {
    app.setCookie(name,"",-1);
  };


  app.global = {
    keys: {
      CURRENT_ROUTE: 'current_route',
      LOCATION_HISTORY: 'loc_history',
      AUTO_SUGGEST: 'auto_suggest',
      PAGER_MODEL_NAME: 'pager_model_name',
      PAGER_ID: 'pager_id',
      PAGER_APP_NAME: 'pager_app_name',
      PAGER_ROUTE: 'pager_route',
      PAGE_ENTRIES: 'page_entries',
      DISPLAY_ROW: 'display_row',
      ROW_COLOR: 'row_color',
      USER_TASK_COUNT : 'task_count',
      USER_COL_SETTINGS : 'user_col_settings',
      BUTTON_COLOR : 'button_color',
      LAUNCHER_MENU : 'launcher_menu',
      COMPANY_CODE : 'company_code',
      MG_PRODUCT_FOR_BOM: 'mg_prod_for_bom',
      USERNAME: 'user_name'
    },
    globelObj: {},
    set: function(key, value) {
      this.globelObj[key] = value
    },
    get: function(key) {
      return this.globelObj[key];
    }
  };

  app.getStaticUrl = function() {
    return '/static/';
  };

  app.getRoute = function(routes, link) {
    for (var url in routes.routes) {
      var route = routes.routes[url];
      if(routes.routes[url].name == link.route) {
        if(typeof route.templateUrl === 'function') {
          return route.templateUrl(link.params);
        }
        else {
          return url;
        }
      }
    }
    return "#";
  };

  function mainController($scope, $rootScope, $route, $compile, $location) {
    $scope.childScope = {}
    $scope['availableSearchParams98'] = [
      { key: "document", name: "Document" },
    ];

    $scope.$on('advanced-searchbox:leavedEditMode', function(event, searchParameter, tableIndex, cacheParam) {
      if(tableIndex != 98) {
        return;
    }

      var wasSearchRoute = false;
      if ($route.current && $route.current.originalPath == "/search")  {
        wasSearchRoute = true;
      }

      $location.path('/search');
      $scope.childScope['searchParams'+tableIndex][searchParameter.key] = searchParameter.value;
      $scope.searchFor = searchParameter.name + " " + searchParameter.value;

      //If search is initiated from the differt route, do not reload the data
      if(wasSearchRoute) {
        $scope.childScope['searchParams'+tableIndex][searchParameter.key] = searchParameter.value;
        $scope.childScope.reloadData(parseInt(tableIndex));
      }

      $('#basePageTitle').text("Search results for "+ searchParameter.name + " - " + searchParameter.value);
    });
    var deal_related_filters = [
      'deal_kanaban_inqnr',
      'deal_kanaban_company_name,',
      'deal_kanaban_sales_person',
      'deal_kanaban_quotation_date',
      'deal_kanaban_service_type',
      'deal_kanaban_layer_type',
    ]
    $scope.$on('advanced-searchbox:removedSearchParam', function(event, searchParameter, tableIndex, cacheParam) {
      if(!deal_related_filters.includes(searchParameter.key)){
        delete $scope.childScope['searchParams'+tableIndex][searchParameter.key];
        $scope.searchFor = null;
        if ($route.current && $route.current.originalPath == "/search")  {
          $('#basePageTitle').text("Search results");
          $scope.childScope.reloadData(parseInt(tableIndex));
        }
      }
    });

    // searchbarEventsHandler($scope, $scope)

    $scope.addViewButtons = function(view) {
      angular.element($('#top_action_bar')).html($compile(view)($scope));
    };

    window.addEventListener(
        'hashchange',
        function () {
          $('.modal').modal('hide');
          $('.modal-backdrop').removeClass('modal-backdrop');
          // For Emptying search-bar on opening different modules or on url change
          if ($route.current && $route.current.originalPath != '/search') {
            $('.advancedSearchBox').find('span.remove-all-icon').click();
          }
        },
        false
    );

    $scope.goBack = function(event, hashURL,is_history) {
      // event.preventDefault();

/*      if(hashURL)
        window.location.hash = hashURL;
      else
        window.history.back();*/
      // var locationHistory = app.global.get(app.global.keys.LOCATION_HISTORY);

      var index = 3;
      if (is_history) {
        index = 2;
      }
      var locationHistory = JSON.parse(app.getStorage(app.global.keys.LOCATION_HISTORY));
      var prevUrl = locationHistory.length > 0 ? locationHistory[locationHistory.length-index].Location : "/";
      // app.global.set(app.global.keys.LOCATION_HISTORY, locationHistory);
      app.setStorage(app.global.keys.LOCATION_HISTORY, JSON.stringify(locationHistory));
      if (!is_history) {
        if(prevUrl == '/' || hashURL != ''){
          // console.log(prevUrl,'if');
          prevUrl = hashURL;
        }
      }
      if(locationHistory.length <= 1) {
        $('.back-btn').hide();
      }
      window.location.hash = prevUrl;
    };

    $('body').off('click', 'a.show-tab');
    $('body').on('click', 'a.show-tab', function(e) {
        e.preventDefault();
        $(this).tab('show');
        var currentIndex = $(this).attr('index');
        //code for realign datatable on tab click
        var currentId = $(this).attr('href').substring(1);
        var modalFtElement = $(this).closest('.modal-body').siblings('.modal-footer')
        modalFtElement.find('.tab-pane').removeClass('active');
        modalFtElement.find('#'+currentId).addClass('active');
        //Code for related search box

        $('.tab-search').find('.tab-content').removeClass('tab-search-active ');
        $('.tab-search').find('#'+currentId+'-search').addClass('tab-search-active');

        $('.tab-fav').removeClass('tab-fav-active ');
        $('#'+currentId+'-fav').addClass('tab-fav-active');

        var current_page_url = window.location.href
        current_page_url = current_page_url.split("/#")[1]
        current_page_url = '/b/#'+current_page_url;
        $('#app_container').find('.tab-fav').removeClass('glyphicon-star').addClass('glyphicon-star-empty').css({"color": "#797D83"});
        $('#app_container').find('.tab-fav').attr('title', 'Bookmark this page')
        $( ".fav_page" ).each(function() {
          if($(this).css('display') == 'block'){
            url = $(this).find('a').attr('href');
            if (current_page_url == url ) {
              $('#app_container').find('.tab-fav').removeClass('glyphicon-star-empty').addClass('glyphicon-star').css({"color": "#1174da"});
              $('#app_container').find('.tab-fav').attr('title', 'Remove bookmark')
          }
        }
        });

        // return false;
        $.fn.dataTable.tables( {visible: true, api: true} ).columns.adjust();

        //Code for reset checbox
        var tabtables = $.fn.dataTable.tables();
        for(var i = 0 ; i <tabtables.length; i++){
          var count = i+1;
          $('.allListing'+(count)).prop('checked', false);
          $(tabtables[i]).find('tr').removeAttr('style') ;
        }

        //Code for reset extra btn
        // var selections  = $scope.childScope.config1.selections;
        // if(selections != undefined && selections.length > 0){
        //   for(var i = 0 ; i <selections.length; i++){
        //      $scope.$apply(function(){
        //         $rootScope[selections[i].ngDisabled]  = true;
        //     });
        //   }
        // }

        //code t preserve search box values in tab
        if(currentIndex != undefined){
          var searchIndex= 0;
          var seachData = []
          var aoData = []
          while (true) {
            searchIndex++;
            if ($scope.childScope['searchParams'+searchIndex]){
              $.each($scope.childScope['searchParams'+searchIndex], function(key, value) {
                var is_exist = false
                for(var i=0 ; i < aoData.length; i++){
                  if(aoData[i].name == key){
                    is_exist = true
                  }
                }
                if(!is_exist){
                  seachData.push($scope.childScope['searchParams'+searchIndex])
                  aoData.push({
                    "name": key,
                    "value": value
                  });
                }
              });
            }
            else{
              break
            }
          }

          for(var j=1 ; j < searchIndex; j++){
            for(var k=0 ; k < seachData.length; k++){
                $scope.childScope['searchParams'+j] = seachData[k]
                for( var key in seachData[k]){
                  $scope.$apply(function(){
                    $scope.childScope['searchParams'+j][key] = seachData[k][key]
                  });
                }
              }
          }

          if(seachData.length > 0){
            $scope.childScope.reloadData(parseInt(currentIndex));
          }
        }

    });
  };

  app.MsgType = {
    Error: 0,
    Success: 1,
    Warning: 2
  };
  app.DecimalPoint = 4

  app.postForm = function(postInfo, form, $scope, callback, msgId, saveButtonId) {
    if(typeof saveButtonId !== typeof undefined) {
      $('#'+saveButtonId).attr('disabled', true);
    }

    //Remove attchment control's form from the parent form object to avoide jquery form validation error.
    var validator = form.validate({
        ignore: "",
        invalidHandler: function(e, validator){
            $('ul.nav-tabs>li>a').removeClass('tab-error');
            var erroredElement = '';
            if(validator.errorList.length){
              $(validator.errorList).each(function(){
                  var elementId = this.element.id.trim();
                  if(elementId != ''){
                      if($('div.tab-content').find('#'+elementId).length > 0){
                          var tabId = $('#'+elementId).closest(".tab-pane").attr('id');
                          $('.nav-tabs a[href="#'+tabId+'"]').addClass('tab-error');
                          if(erroredElement == ''){
                              $('.nav-tabs a[href="#' + tabId + '"]').tab('show');
                              erroredElement = elementId;
                          }
                      }
                  }
              });
            }
        }
    });

    $.validator.addMethod("checkurl", function(value, element) {
        return /^(www\.)[A-Za-z0-9_-]+\.+[A-Za-z0-9.\/%&=\?_:;-]+$/.test(value);
        }, "Please enter a valid URL."
    );

    $.validator.addMethod("accept", function(value, element, param) {
      var typeParam = typeof param === "string" ? param.replace(/\s/g, '').replace(/,/g, '|') : "image/*",
      optionalValue = this.optional(element),
      i, file;

      if (optionalValue) {
        return optionalValue;
      }

      if ($(element).attr("type") === "file") {
        typeParam = typeParam.replace(/\*/g, ".*");
        if (element.files && element.files.length) {
          for (i = 0; i < element.files.length; i++) {
            file = element.files[i];
            if (!file.type.match(new RegExp( ".?(" + typeParam + ")$", "i"))) {
              return false;
            }
          }
        }
      }
      return true;
    }, "Please enter a value with a valid mimetype.");

    $.validator.addMethod("extension", function(value, element, param) {
      param = typeof param === "string" ? param.replace(/,/g, '|') : "png|jpe?g|gif";
      return this.optional(element) || value.match(new RegExp(".(" + param + ")$", "i"));
    }, "Please enter a file with a valid extension.");

    //Overwrite default method to handle blank space issue.
    $.validator.methods.number = function(value, element, param) {
        value = value.trim();
        return this.optional( element ) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
    };

    $.validator.addMethod("nowhitespace", function (value, element) {
      return this.optional(element) || /^$|.*\S+.*/i.test(value);
    }, "This field is required.");
    
    validator.form();
    if (!validator.valid()) {
      return;
    }

    var postData = new FormData(form.get(0));

    $.each(postInfo, function(key, value) {
      postData.append(key, value);
    });

    $scope.btnDisabled = true;

    $.ajax({
      type: form.attr('method'),
      url: form.attr('action'),
      data: postData,
      cache: false,
      dataType: 'json',
      processData: false,
      contentType: false,
      headers: {
        "X-CSRFToken": app.getStorage("csrftoken")
      },
      beforeSend: function() {
        $('#loading-image').show();
      },
      complete: function() {
        $('#loading-image').hide();
        if(typeof saveButtonId !== typeof undefined) {
          $('#'+saveButtonId).removeAttr('disabled');
        }
      },
      success: function(data) {
        $scope.$applyAsync(function() {
          $scope.btnDisabled = false;
          msgId = msgId || "appMsg"
          if (data.code == 0) {
            var dataMsg = data.msg;
            if(typeof data.msg =='object')
            {
                dataMsg = '';
                $.each(data.msg, function(index,jsonObject){
                    $.each(jsonObject, function(key,val){
                        dataMsg += index+': '+val+'<br/>';
                    });
                });
            }
            dataMsg = (dataMsg || "").trim();
            if (dataMsg === "") {
              dataMsg = "Error occurred."
            }
            app.showMessage(msgId, app.MsgType.Error, dataMsg, 10);
            return;
          }

          if(data.msg != undefined && data.msg !=''){
              app.showMessage(msgId, app.MsgType.Success, data.msg, 10);
          }

          //Manage "Save and Save & New" action.
          //TOOD: Handle same actions for dialog
          if(data.code == 1) {
              var action = postInfo.action;
              if(action == 's' || action == 'sn') {
                var currentRoute = app.global.get(app.global.keys.CURRENT_ROUTE);
                var currentUrl;
                if(typeof currentRoute.templateUrl === 'function') {
                  if(action == 's') {
                    currentRoute.pathParams['id'] = data.id;
                  }
                  else {
                    currentRoute.pathParams['id'] = 0;
                  }

                  currentUrl = currentRoute.templateUrl(currentRoute.pathParams);
                }
                else {
                  currentUrl = currentRoute.templateUrl
                }

                window.location.hash = currentUrl;
              }
              //TODO: Remove else block once action applied to all pages.
              else {
                if(postInfo.id ==0) {
                  app.resetForm(form);
                }
              }
          }

          if (callback) {
            callback(data);
          }
        });
      },
      error: function(data) {
        $scope.$applyAsync(function() {
          app.showMessage("appMsg", app.MsgType.Error, "Error occurred", 10);
          $scope.btnDisabled = false;
        });
      }
    });
  };

  app.post = function(url, postData, hasMsg, callback, dataType, msgId, processData, contentType, saveButtonId, args) {
    if(typeof saveButtonId !== typeof undefined) {
      $('#'+saveButtonId).attr('disabled', true);
    }

    msgId = msgId || "appMsg";
    var hideLoading = false;
    if(typeof args !== typeof undefined && typeof args['hideLoading'] !== typeof undefined) {
      hideLoading = args['hideLoading']
    }
    var ajaxParam = {
      dataType: dataType || "json",
      type: "POST",
      headers: {
        "X-CSRFToken": app.getStorage("csrftoken")
      },
      url: url,
      data: postData,
      beforeSend: function() {
        if(!hideLoading){
          $('#loading-image').show();
        }
      },
      complete: function() {
        if(!hideLoading){
          $('#loading-image').hide();
        }
        if(typeof saveButtonId !== typeof undefined) {
          $('#'+saveButtonId).removeAttr('disabled');
        }
      },
      success: function(data) {
        if (hasMsg) {
          if (data.code == 0) {
            var msg = (data.msg || "").trim();
            if (msg === "") {
              msg = "Error occurred."
            }
            app.showMessage(msgId, app.MsgType.Error, msg, 10);
            return;
          }

          app.showMessage(msgId, app.MsgType.Success, data.msg, 10);
        }

        if(callback) {
          callback(data);
        }
      },
      error: function(data) {
        app.showMessage(msgId, app.MsgType.Error, "Error occurred", 10);
        console.log(data);
      }
    };

    if(typeof processData !== typeof undefined) {
      ajaxParam['processData'] = processData;
    }

    if(typeof contentType !== typeof undefined) {
      if(!contentType) {
        ajaxParam['contentType'] = contentType;
      }
    }

    $.ajax(ajaxParam);
  };

  app.downloadData = function(url, postData) {
    var form = $('<form></form>').attr('action', url).attr('method', 'post');

    $.each(postData, function( key, value) {
      form.append($("<input></input>").attr('type', 'hidden').attr('name', key).attr('value', value));
    });

    $('#loading-image').show();
    form.appendTo('body').submit().remove();
    setTimeout(function() {
        $('#loading-image').hide()
      },3000);
  }

  app.getAppData  = function(){
      app.post('/b/get_app_data/', {}, false, function(data) {
          if ($('#app_container').height() < 10) {
              var height = $(window).height() - ($('.nav_menu').outerHeight() + 45);
              $('#app_container').css({
                "max-height": height+ 10 + "px",
                "height": height+ 10 + "px",
                "overflow": "auto"
              });
          }

          app.global.set(app.global.keys.COMPANY_CODE, data.company_code);

          app.global.set(app.global.keys.USERNAME, data.user_name);

          if(data.row_color != ''){
              app.global.set(app.global.keys.ROW_COLOR, data.row_color);
          }
          if(data.button_color != ''){
              app.global.set(app.global.keys.BUTTON_COLOR, data.button_color);
          }

          if(data.display_row != ''){
              app.global.set(app.global.keys.DISPLAY_ROW, data.display_row);
          }

          if(data.decimal_point != ''){
            app.DecimalPoint = data.decimal_point;
          }

          var current_version = $('#id_release_note').text();
          if(current_version != '' && sparrow.getStorage('has_release') != 'false|'+current_version) {
              sparrow.setStorage('has_release', 'true|'+current_version, 365);
              $('.has-release').show();
          }
          app.global.set(app.global.keys.USER_COL_SETTINGS, data.user_col_settings);
          // var locationHistory = JSON.parse(app.getStorage(app.global.keys.LOCATION_HISTORY));
          // if(locationHistory.length > 1) {
          //   $('.back-btn').show();
          // }
      });
  };

  app.tabIndex = 1;

  var sendUnreadPushNotification = function(data) {
    var user_notification_ids = [];
    var company_code = app.global.get(app.global.keys.COMPANY_CODE);
    var extension = "png"
    if(company_code=='2'){
      extension="jpg"
    }
    for (var i = 0; i <data.user_notifications.length; i++ ){
      Push.create(data.user_notifications[i]['notification_subject'], {
          body: "",
          icon:  "/static/base/images/comp_code_"+company_code+"."+extension+"/",
          tag: 'tag'+[i],

          onClick: function () {
              window.focus();
              this.close();
              window.location.hash = "#/messaging/notifications" ;
          }
        });
        if(Push.Permission.DENIED && Push.Permission.DEFAULT){
          $('.desktop-notification').show();
        }
        Push.clear();
        Push.close('tag'+[i]);
        user_notification_ids.push(data.user_notifications[i]['user_notification_id']);
      }

      if(user_notification_ids.length > 0){
        app.post('/messaging/update_push_notify/', {user_notification_ids: JSON.stringify(user_notification_ids)},false,function(data){});
      }
  }

var reloadNotificationCount = function() {
    $('#loading-image').hide();
    app.post('/messaging/get_unread_count/', {}, false, function(data) {
        if(data.notification_count != 0 || data.user_notification_count != 0){
            $('#notification_count').show();
            if(data.user_notification_count > 0){
              sendUnreadPushNotification(data)
              $('#notification_count').css('background-color', 'red');
            } else {
              $('#notification_count').css('background-color', '');
            }
            $('#notification_count').css('display', '');
            $('#notification_count').addClass('label-primary notification_indicator classCount');
            $('#notification_count').text(data.notification_count + data.user_notification_count);
        }
        else {
          $('#notification_count').hide();
        }
    },'json', 'appMsg', undefined, undefined, undefined, {'hideLoading': true});
  }

  setInterval(function(){
    reloadNotificationCount()
  }, 300000);

  app.enableNotification = function(){
    Push.Permission.request(onGranted, onDenied);
  }
  function onGranted(){

  }
  function onDenied(){

  }
 var favourite = {
    init: function() {
      this.events();
    },
    events: function() {
      $(document).on('click', '.favourite_icon', function(){
          var iSelector = $(this);
          var title = $('#basePageTitle').text();
          var res = title.substring(0, 3);

          $('.fav_page').each(function(){
            var existSelector = $(this);
            var existRefUrl = $(this).attr('refUrl');
            var existRes = $(this).attr('res');
            if($(this).hasClass('page_title'+existRes)){
              favourite.postFavData(existSelector, existRes, existRefUrl, true);
            }

          });

          if (iSelector.hasClass('glyphicon-star-empty')) {
            $('.favourite_icon').css({'pointer-events':'none'});
            var refUrl = window.location.href;
            var buttonColor = sparrow.global.get(sparrow.global.keys.BUTTON_COLOR);

            $(".favourite_page").append('<div class="fav_page page_title'+res+'" refUrl="'+refUrl+'" res="'+res+'"><span class="label-warning" style="background-color:'+buttonColor+';width:100px;padding: 3px 0px 2px 5px;border-radius:.25em;"><input id="title'+res+'" class="editPageName"  type="text" value="'+title+'" autofocus="autofocus"/></span></div>');
            $('#title'+res).select();
            $('.page_title'+res).on('keyup', function(e) {
              if($('#title'+res).val().length != 0 ){
                if(e.which == 13) {
                  favourite.postFavData(iSelector, res, refUrl, false);
                }
              }
              if($('#title'+res).val().length == 0 ){
                $('.favourite_icon').css({'pointer-events':''});
                if(e.which == 13) {
                  $('.page_title'+res).hide();
                  $('.editPageName').hide();
                  $('#title'+res).remove();
                }
              }
            });
          }
          else if (iSelector.hasClass('glyphicon-star')) {
            var postData = {
              url : window.location.href
            }
            iSelector.removeClass('glyphicon-star').addClass('glyphicon-star-empty').css({"color": "#797D83"});
            sparrow.post("/base/delete_page_favorite/", postData, false, function(data) {
              if(data.favorite_view_id){
                $('#favoritePage'+data.favorite_view_id).css('display','none');
                $('.favourite_icon').attr('title', 'Bookmark this page');
              }
            });
          }
      });

        $(document).on('click', '.favourite-cancel', function(){
          var favorite_view_id = $(this).attr('refrence');
          var favorite_url = $(this).prev().attr('href');
          var url_without_domain = '/b/#'+window.location.href.split('/#')[1];
          $('#favoritePage'+favorite_view_id).css('display','none');
          var postData = {
            favorite_view_id : favorite_view_id,
          }
          sparrow.post("/base/delete_page_favorite/", postData, false, function(data) {
            if((data.favorite_view_id) && (favorite_url==url_without_domain)){
              $('.favourite_icon').removeClass('glyphicon-star').addClass('glyphicon-star-empty').css({"color": "#797D83"});
              $('.favourite_icon').attr('title', 'Bookmark this page');
            }
          });
        });
    },
    setFavoritePage: function() {
      var current_page_url = window.location.href
      current_page_url = current_page_url.split("/#")[1]
      current_page_url = '/b/#'+current_page_url;
      $('.favourite_icon').removeClass('glyphicon-star').addClass('glyphicon-star-empty').css({"color": "#797D83"});
      $('.favourite_icon').attr('title', 'Bookmark this page');
      $( ".fav_page" ).each(function() {
        if($(this).css('display') == 'block'){
          url = $(this).find('a').attr('href');
          if (current_page_url == url ) {
            $('.favourite_icon').removeClass('glyphicon-star-empty').addClass('glyphicon-star').css({"color": "#1174da"});
            $('.favourite_icon').attr('title', 'Remove bookmark')
            setTimeout(function(){
              $('#app_container').find('.tab-fav').removeClass('glyphicon-star-empty').addClass('glyphicon-star').css({"color": "#1174da"});
              $('#app_container').find('.tab-fav').attr('title', 'Remove bookmark')
            }, 500);
          }
        }
      });
    },
    postFavData: function(iSelector, res, url, is_besfore_add) {
      $('.favourite_icon').css({'pointer-events':''});
      var postData = {
        name:$('#title'+res).val(),
        url : url
      }
      $('.page_title'+res).hide();
      $('.editPageName').hide();
      iSelector.removeClass('glyphicon-star-empty').addClass('glyphicon-star').css({"color": "#1174da"});
      sparrow.post("/base/add_page_favorite/", postData, false, function(data) {
        var buttonColor = sparrow.global.get(sparrow.global.keys.BUTTON_COLOR);
        if(data.favorite_view_id){
            if(is_besfore_add){
              $(".favourite_page .fav_page:last").before('<div class="fav_page" id = "favoritePage'+data.favorite_view_id+'"> <div class="label label-warning" style="background-color:'+buttonColor+'"><a class="fav-title" href="'+data.url+'"><span title= "'+postData.name+'">'+postData.name+'</span></a><span refrence= "'+data.favorite_view_id+'" class="icon-cancel-circle favourite-cancel" title="Remove bookmark"></span></div></div>');
            }
            else{
              $(".favourite_page").append('<div class="fav_page" id = "favoritePage'+data.favorite_view_id+'"> <div class="label label-warning" style="background-color:'+buttonColor+'"><a class="fav-title" href="'+data.url+'"><span title= "'+postData.name+'">'+postData.name+'</span></a><span refrence= "'+data.favorite_view_id+'" class="icon-cancel-circle favourite-cancel" title="Remove bookmark"></span></div></div>');
            }
            $('#title'+res).remove();
            $('.favourite_icon').attr('title', 'Remove bookmark')
        }
      });
    }
  };
  favourite.init();

  app.run(function($rootScope, $route, $templateCache, $location) {
    app.getAppData();
    $rootScope.$on('$viewContentLoaded', function() {
      var searchField = $templateCache.get('angular-advanced-searchbox.html');
      var suggestion = $templateCache.get('uib/template/typeahead/typeahead-popup.html');
      var matches = $templateCache.get('uib/template/typeahead/typeahead-match.html');
      var comments = $templateCache.get('angular-comments.html');
      var tasks = $templateCache.get('angular-tasks.html');
      var attachments = $templateCache.get('angular-attachments.html');
      var subscriptions = $templateCache.get('angular-subscriptions.html');

      $templateCache.removeAll();

      $templateCache.put('angular-advanced-searchbox.html', searchField);
      $templateCache.put('uib/template/typeahead/typeahead-popup.html', suggestion);
      $templateCache.put('uib/template/typeahead/typeahead-match.html', matches);
      $templateCache.put('angular-comments.html', comments);
      $templateCache.put('angular-tasks.html', tasks);
      $templateCache.put('angular-attachments.html', attachments);
      $templateCache.put('angular-subscriptions.html', subscriptions);

    });

    $('#top_action_bar').on('click','.pager-button',function(){
        event.preventDefault();
        var modelName = sparrow.global.get(sparrow.global.keys.PAGER_MODEL_NAME);
        var currentId = sparrow.global.get(sparrow.global.keys.PAGER_ID);
        var appName = sparrow.global.get(sparrow.global.keys.PAGER_APP_NAME)
        var mode = $(this).attr('data-pager');
        var searchQuery = {};
        var queryString = '';
        if(window.location.href.indexOf('?') > -1){
            queryString = window.location.href.substring(window.location.href.indexOf('?') + 1);
        }
        var queries = queryString.split('&');
        for (i = 0; i < queries.length; ++i) {
            if(queries[i]!=''){
                var queryData = queries[i].split('=');
                if(queryData.length > 0){
                    queryValue = queryData.length > 1 ? queryData[1] : '';
                    searchQuery[queryData[0]] = queryValue;
                }
            }
        }

        var locationHistory = JSON.parse(app.getStorage(app.global.keys.LOCATION_HISTORY)) || [];
        if(locationHistory.length > 1){
            var parentPath = locationHistory[locationHistory.length-2];
            var pathSlash = parentPath.Location.substr(-1)!='/' ? parentPath.Location+'/': parentPath.Location;
            var pathNonSlash = parentPath.Location.replace('//$/g','');
            var orgPathSlash = parentPath.OrginalPath.substr(-1)!='/' ? parentPath.OrginalPath+'/': parentPath.OrginalPath;
            var orgPathNonSlash = parentPath.OrginalPath.replace('//$/g','');

            var searchCacheParams = app.searchCache.get(pathSlash);
            var searchCacheParams = (searchCacheParams.length == undefined || searchCacheParams.length == 0)? app.searchCache.get(pathNonSlash) : searchCacheParams;
            var searchCacheParams = (searchCacheParams.length == undefined || searchCacheParams.length == 0)? app.searchCache.get(orgPathSlash) : searchCacheParams;
            var searchCacheParams = (searchCacheParams.length == undefined || searchCacheParams.length == 0)? app.searchCache.get(orgPathNonSlash) : searchCacheParams;

            $.each(searchCacheParams, function(key, value) {
              if(value!='##') {
                searchQuery[key] = value;
              }
            });
        }

        sparrow.post("/b/pagers/", {'model_name': modelName, 'id': currentId, 'app_name': appName, 'mode': mode, 'query': JSON.stringify(searchQuery)}, false, function(data) {
            if(data.id !=undefined && data.id !='')
            {
                var query = '';
                if(window.location.href.indexOf('?') > -1 ){
                    //query = '?'+window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
                    query = '?'+window.location.href.slice(window.location.href.indexOf('?') + 1);
                }
                window.location.hash = sparrow.global.get(sparrow.global.keys.PAGER_ROUTE)+data.id+query;
            }
        });
    });

    $rootScope.$on('$routeChangeSuccess', function() {
        //set current route to globle object
        app.global.set(app.global.keys.CURRENT_ROUTE, $route.current)

        //Manage location history for back navigation
        var locationHistory = JSON.parse(app.getStorage(app.global.keys.LOCATION_HISTORY)) || []
        var pushHistory = true;

        if(locationHistory.length > 0) {
          var pathSlash = locationHistory[locationHistory.length-1].Location.substr(-1)!='/' ? locationHistory[locationHistory.length-1].Location+'/':locationHistory[locationHistory.length-1].Location;
          var pathNonSlash = locationHistory[locationHistory.length-1].Location.replace('//$/g','');
          if(locationHistory[locationHistory.length-1].Location == (window.location.hash).replace('#','')){
              pushHistory = false;
          }
          /*if($route.current != undefined && ($route.current.regexp.test(pathSlash) || $route.current.regexp.test(pathNonSlash))){
              pushHistory = false;
          }*/
        }

        favourite.setFavoritePage();

        //Romove dynamically added element for particular view
        $('#titlebarPH').html('');

        if($route.current && pushHistory) {
          locationHistory.push({OrginalPath: $route.current.originalPath, Location:  (window.location.hash).replace('#','')});
        }
        app.setStorage(app.global.keys.LOCATION_HISTORY, JSON.stringify(locationHistory))
        if(locationHistory.length > 1) {
          $('.back-btn').show();
        }
        // Reset user specific task count
        var taskCount = sparrow.global.get(sparrow.global.keys.USER_TASK_COUNT);
        sparrow.deleteCookie('taskFilter');
        if(taskCount == '0'){
          $('#task_count').text('');
        }
        if(taskCount){
          $('#task_count').addClass('btn-primary classCount');
          $('#task_count').text(taskCount);
        }
    });
  });

  app.resetForm = function(form) {
      form.find('input:text, input:password, input:file, select, textarea').val('');
      form.find('input:radio, input:checkbox').removeAttr('checked').removeAttr('selected');
  };

  app.redirect = function(url) {
    window.location = "/b" + url;
  };

  app.searchCache = {
    data: [],
    get: function(keyData) {

      var result = $.grep(this.data, function(e) {
        return e.key == keyData;
      });

      var searchParam = {};

      // //At zero index set orginal page url. Using this information search parameter will be set accoriding to their page.
      // if(this.data.length > 0) {
      //   searchParam[this.data[0].key] = "##";
      // }

      $.each(result, function(key, value) {
        searchParam[value.value.key] = value.value.value;
      });

      return searchParam;
    },
    put: function(keyData, valueData) {
      var hasKey = false;
      $.each(this.data, function(key, value) {
        if (value.value.key == valueData.key) {
          app.searchCache.data[key] = {
            key: keyData,
            value: valueData
          };
          hasKey = true;
          return false;
        }
      });

      if (!hasKey) {
        this.data.push({
          key: keyData,
          value: valueData
        });
      }
    },
    remove: function(keyData, valueKey) {
      $.each(this.data, function(i){
          if(app.searchCache.data[i].value.key === valueKey) {
              app.searchCache.data.splice(i,1);
              return false;
          }
      })
    },
    removeAll: function() {
      this.data = [];
    }
  };

  app.controller('YesNoController', ['$scope', 'close', function($scope, close) {
    $scope.close = function(result) {
      close(result, 500);
    };
  }]);

  app.showConfirmDialog = function(ModalService, msg, title, callback, kwargs) {
    //If ModalService is undefined then display default confirm box
    if(ModalService === undefined) {
      callback(confirm(msg));
      return
    }
    var positiveBtnText = kwargs != undefined && kwargs.positiveBtnText != undefined ? kwargs.positiveBtnText : 'Yes';
    var negativeBtnText = kwargs != undefined && kwargs.negativeBtnText != undefined ? kwargs.negativeBtnText : 'No';
    var hidePositiveBtn = kwargs != undefined && kwargs.hidePositiveBtn != undefined && kwargs.hidePositiveBtn == true ? 'display: none;' : '';
    var hideNegativeBtn = kwargs != undefined && kwargs.hideNegativeBtn != undefined && kwargs.hideNegativeBtn == true ? 'display: none;' : '';

    ModalService.showModal({
      template: '<div class="modal fade">\
        <div class="modal-dialog custom-dialog">\
          <div class="modal-content">\
            <div class="modal-header">\
              <button type="button" class="close" ng-click="cancel()" data-dismiss="modal" aria-hidden="true">&times;</button>\
              <h4 class="modal-title">'+title+'</h4>\
            </div>\
            <div class="modal-body custom-body">\
              <p>'+msg+'</p>\
            </div>\
            <div class="modal-footer">\
              <button type="button" style="'+hidePositiveBtn+'" ng-click="close(true)" class="btn btn-primary" data-dismiss="modal">'+positiveBtnText+'</button>\
              <button type="button" style="'+hideNegativeBtn+'" ng-click="cancel()" class="btn btn-default" data-dismiss="modal">'+negativeBtnText+'</button> \
            </div>\
          </div>\
        </div>\
      </div>',
      controller: "YesNoController"
    }).then(function(modal) {
      modal.element.modal();
      modal.close.then(function(result) {
        callback(result)
      });
    });
  }

  app.setDatatable = function(callback, compile, DTOptionsBuilder, scope, rootScope, currentRoute, listing, listingall, ModalService) {
    var height = $(window).height() - ($('.nav_menu').outerHeight() + 205);
    /*
      Inline edit and delete buttons event handling
     */
    if (listing.inlineCrud) {
      if (listing.inlineCrud.edit) {
        scope.inlineEdit = function(tIndex, id) {
          $.grep(Object.keys(listingall), function (k) {
            if(listingall[k].index == tIndex) {
              var currentListing = listingall[k];
              if (currentListing.inlineCrud.edit.callback) {
                  currentListing.inlineCrud.edit.callback(scope['rowData' + tIndex][id]);
                } else if (currentListing.inlineCrud.edit.url) {
                  window.location = currentListing.inlineCrud.edit.url + scope['rowData' + tIndex][id].id;
                }
            }
         })
        }
      }

      if (listing.inlineCrud.delete) {
        scope.inlineDelete = function(tIndex, id) {
          app.showConfirmDialog(ModalService, "Are you sure you want to delete record?", "Delete record", function(confirmAction){
            if(!confirmAction) {
              return;
            }

            $.grep(Object.keys(listingall), function (k) {
              if (listingall[k].index == tIndex) {
                var currentListing = listingall[k];
                url = currentListing.inlineCrud.delete.url;
                var data = scope['rowData' + tIndex][id];

                app.post(url, { id: data.id }, true, function(data) {
                  scope.reloadData(tIndex);

                  if (currentListing.inlineCrud.delete.callback) {
                    currentListing.inlineCrud.delete.callback(data);
                  }
                });
              }
            })
          });
        }
      }
    }

    /*
      Multiple datatable's variable initializing
     */
    scope['config' + listing.index] = listing;
    scope['selected' + listing.index] = [];
    scope['dtInstance' + listing.index] = function (dtInstance) {
      scope['dtInstance' + listing.index] = dtInstance;
    };

    scope['rowData' + listing.index] = [];

    scope.clearSelection = function(index) {
      scope['selected' + index] = [];
    };

    scope.openColumnConfigDialog = function(event, tabIndex){
      var colOrderDataobjs = sparrow.global.get(sparrow.global.keys.USER_COL_SETTINGS);
      var colOrder = []
      var checkCol = []
      for(var b=0; b < colOrderDataobjs.length; b++ ){
        if(colOrderDataobjs[b].url == (window.location.href.split("/#")[1]).replace(/[0-9]/g, '') && colOrderDataobjs[b].table_index == tabIndex ){
          var gotSettings = JSON.parse(colOrderDataobjs[b].col_settings);
          colOrder = gotSettings.col_order;
          checkCol = gotSettings.hide_col;
        }
      }
      var currentColumns = [];
      for(var n = 0; n < listingall.length; n ++ ){
        currentIndex = listingall[n].index == undefined ? 1 : listingall[n].index
        if(currentIndex == tabIndex){
          currentColumns = listingall[n].columns;
          break;
        }
      }

      $('#idColumnReorderDiv').text('');
      var optionLength = 0;
      var uiColSettingLength = colOrder.length;
      var confingColLength = currentColumns.length;
      var displayColumns = [];

      //First set column on the same index in displayColumns array based on user defined sequences.
      for(var p=0; p<colOrder.length; p++) {
        if(currentColumns.indexOf(colOrder[p]) > -1) {
          displayColumns.push(colOrder[p])
        }
      }

      //Insert new columns in the displayColumns array. There might be the columns which would added after user has saved setting.
      for(var q=0; q<currentColumns.length; q++) {
        if(displayColumns.indexOf(currentColumns[q]) == -1) {
          displayColumns.splice(q, 0, currentColumns[q]);
        }
      }

      var hiddenCols = [];
      for(var a=0 ; a < displayColumns.length; a++ ){
        if(displayColumns.length > confingColLength && a > confingColLength - 1) {
          continue;
        }
        if(currentColumns[a].class != undefined && currentColumns[a].class.indexOf("hide-items") > -1){
          if(displayColumns.indexOf(a) < 0){
            hiddenCols.push(a);
          }
          continue;
        }
        if(currentColumns[a].title == '' || currentColumns[a].name == 'edit' || currentColumns[a].name == null) {
          continue;
        }
        optionLength += 1;

        var optionValue = currentColumns[a].name;
        var checked ='checked';
        for( var b=0; b < checkCol.length; b++){
          if((optionValue == displayColumns[a].name) &&(displayColumns[a].name== checkCol[b])){
            var checked = '';
          }
        }
        var configColumn = '<div class="configColumn" column-name="'+displayColumns[a].name+'">\
                              <input type="checkbox" id="id_check_'+displayColumns[a].name+'" class="magic-checkbox" '+checked+'>\
                              <label for="id_check_'+displayColumns[a].name+'" ></label><span class="configColumnLabel">'+currentColumns[a].title+'</span>\
                            </div>'
        $('.configColumn').first().addClass('selectedConfigColumn');
        $('#idColumnReorderDiv').append(configColumn)
      }

      $("#colReorder_form").attr('index',tabIndex);
      $('#colReorder_model').modal('show');
      $('#reorderCallHidden').text(hiddenCols.join([separator = ',']));
      $('.configColumnLabel').click(function(){
        $('.configColumn').removeClass('selectedConfigColumn');
        $(this).parent().addClass('selectedConfigColumn');
      });
    }

    /*
      Datatables row selection
     */
    function getDTInstance(index) {
      return scope['dtInstance' + index];
    }

    function getSelected(index) {
      return scope['selected' + index];
    }

    function updateDrawerMenuButtons(index) {
      // var selected = getSelected(index).length === getDTInstance(index).dataTable.fnSettings()._iDisplayLength;
      //Disable top actionbar buttons according to configuration
      var selectLength = getSelected(index).length;
      for (i = 0; i < listing.selections.length; i++) {
        var selectionDisable = selectLength == 0
        var btnSelection = listing.selections[i];
        if(!btnSelection.multiselect && selectLength > 1) {
          selectionDisable = true;
        }
          rootScope[btnSelection.ngDisabled] = selectionDisable;
      }
    }

    var updateSelected = function(index, action, id) {
      if (action === 'add' && getSelected(index).indexOf(id) === -1) {
        getSelected(index).push(id);
      }
      if (action === 'remove' && getSelected(index).indexOf(id) !== -1) {
        getSelected(index).splice(getSelected(index).indexOf(id), 1);
      }
    };

    scope.updateSelection = function(index, $event, id) {
      var checkbox = $event.target;
      var action = (checkbox.checked ? 'add' : 'remove');
      if(action == 'add'){
        $($(checkbox).closest("tr")).css('background-color',app.global.get(app.global.keys.ROW_COLOR));
      }

      if(action == 'remove'){
        $($(checkbox).closest("tr")).removeAttr('style');
        $('#chk_hd_'+index).prop('checked', false);
      }

      updateSelected(index, action, id);

      if(listing.selectionCallback) {
        var rowData;
        for (var i = 0; i < getDTInstance(index).dataTable.context.rows.length - 1; i++) {
          var entity = getDTInstance(index).dataTable.fnGetData(i);
          if(entity.id == id) {
            rowData = entity;
          }
        }
        listing.selectionCallback(checkbox.checked, rowData);
      }

      updateDrawerMenuButtons(index)
    };

    scope.selectAll = function(index, $event) {
      var checkbox = $event.target;
      var action = (checkbox.checked ? 'add' : 'remove');

      if(action == 'add'){
        $(getDTInstance(index).dataTable.context.rows).css('background-color',app.global.get(app.global.keys.ROW_COLOR));
      }

      if(action == 'remove'){
        $(getDTInstance(index).dataTable.context.rows).removeAttr('style');
      }

      for (var i = 0; i < getDTInstance(index).dataTable.context.rows.length - 1; i++) {
        var entity = getDTInstance(index).dataTable.fnGetData(i);
        updateSelected(index, action, entity.id);
      }

      updateDrawerMenuButtons(index)
    };

    scope.isSelected = function(index, id) {
      if ( getSelected(index).indexOf(id) >= 0){
        updateDrawerMenuButtons(index)
      }
      return getSelected(index).indexOf(id) >= 0;
    };

    /*
      Datatable configurations
    */

    var pageNumber = 0;
    var isInitDrawcallback = false;
    var isInit = true;
    var rowGrouping = listing.rowGrouping;
    // scrollY set only when pass para scrollBody in listing othrewise scrollY not set and also if scrollBody and footerClass available in config then minus footer height

    if(listing.scrollBody){
      if(listing.footerClass != '') {
        var footerHeight = 0
        $.each($('.' + listing.footerClass), function() {
          footerHeight += $(this)[0].offsetHeight / 2;
        });
        height = height - footerHeight;
      }
      height = height + 'px';
    }
    else {
      height = '';
    }


    var options =
      DTOptionsBuilder.newOptions()
      .withOption('fnServerData', function(sSource, aoData, fnCallback) {
        //Add search parameters to post data

        if (scope['searchParams'+listing.index]) {
          $.each(scope['searchParams'+listing.index], function(key, value) {
            aoData.push({
              "name": key,
              "value": value
            });
          });
        }

         $.each(listing.additionalSearchParams, function (i, additionalSearchParam) {
            $.each(additionalSearchParam, function (key, val) {
                aoData.push({
                    "name": key,
                    "value": val
                });
            });
        });

        if(listing.crud) {
          scope.clearSelection(listing.index)
        }

        if(listing.reOrder && $('.reOrder'+listing.uIndex).find('.up_down').length == 0){
          var reOrderBtn = '<span style="float: left;margin-top: 8px;position:relative;" class="up_down"><i id="col_order" ng-click="openColumnConfigDialog($event,'+listing.uIndex+');" style="font-size: 14px;cursor: pointer;" class="icon-settings" title="Configure columns"></i></span>';
          $('.reOrder'+listing.uIndex).prepend(reOrderBtn);
          compile($('.reOrder'+listing.uIndex))(scope);
        }

        //Add class and attribute for use when window resize then scroll body height change.
        if(listing.scrollBody) {
          $('.dataTables_scrollBody').addClass('scroll-body')
          if(listing.footerClass != '') {
            $('.dataTables_scrollBody').attr('footer', listing.footerClass);
          }
        }

        pageNumber = app.global.get("SEARCH_PAGING_"+currentRoute.originalPath) || 0;
        onSearchEvent = app.global.get("SEARCH_EVENT") || false

        $.each(aoData, function(key, object) {
          if(object.name == "length") {
            app.global.set(app.global.keys.PAGE_ENTRIES, object.value);
          }
          //Get data from stored pageNumber. This way we can maintain paging state.
          //Reset start index for paging on search
          if(onSearchEvent && object.name == "start") {
            object.value = 0;
          }
        });
        isInit = false;

        //Take updated listing config that might be change using reloadData function.
        var listConfig = scope['config' + listing.index];

        //If listing has extra post data then add it to aoData which is finally posting through ajax.
        if(listConfig.postData) {
          $.each(listConfig.postData, function( key, val ) {
           aoData.push({name: key, value: val});
         });
        }

        aoData.push({
          "name": "postData",
          "value": JSON.stringify(aoData)
        });


        app.post(listConfig.url, aoData, false, function(json) {
          try {
            fnCallback(json);
          } catch (err) {
            console.log(err);
          }

          json['index'] = listing.index;
          callback(json);
        });
      })

      .withOption('filter', false)
      .withOption('serverSide', true)
      .withDisplayLength(listing.displayLength)
      .withDataProp('data')
      .withOption('scrollY', height)
      .withOption('scrollX', '100%')
      .withOption('scrollCollapse', listing.scrollBody)
      .withOption('dom', '<"top"i>rt<"bottom reOrder'+listing.uIndex+'"flip>')
      .withPaginationType('simple_numbers')
      .withOption('headerCallback', function(header) {
          compile(angular.element(header).contents())(scope);
      })
      .withOption('createdRow', function(row, data, dataIndex) {
        compile(angular.element(row).contents())(scope);
      })
      .withOption('rowCallback', rowCallback)
      .withOption('bInfo', false)
      .withOption('oLanguage', {
        "sEmptyTable": listing.emptyTblMsg,
        "oPaginate": {
          "sNext": '<i class="icon-arrow-2-right" />',
          "sPrevious": '<i class="icon-arrow-2-left" />'
        }
      })
      .withOption('drawCallback', function() {
        // //For row grouping
        // if(rowGrouping){
        //   var api = this.api();
        //   var rows = api.rows( {page:'current'} ).nodes();
        //   var last=null;

        //   api.column(rowGrouping.col, {page:'current'} ).data().each( function ( group, i ) {
        //       if ( last !== group ) {
        //           $(rows).eq( i ).before(
        //               '<tr class="group"><td colspan="15">'+group+'</td></tr>'
        //           );

        //           last = group;
        //       }
        //   });
        // }
        //Prevent drawCallback event it is raised from initComplete
        if(isInitDrawcallback) {
          isInitDrawcallback = false;
          return;
        }
        var tablePageInfo = getDTInstance(listing.index).DataTable.page.info();
        if(tablePageInfo.page > 0 && (tablePageInfo.end - tablePageInfo.start) == 0) {
          getDTInstance(listing.index).dataTable.fnPageChange('previous');
          setTimeout(function(){
            getDTInstance(listing.index).dataTable.fnDraw(false);
          }, 0)
        }
        $('div.dataTables_scrollBody').scrollTop(scope.pageScrollPos);

        //Hide table lenght and pagination controls for empty table
        var datatable = getDTInstance(listing.index).dataTable;
        var paginateEle = datatable.closest('.dataTables_wrapper').find('.dataTables_paginate')
        var tableLengthEle = datatable.closest('.dataTables_wrapper').find('.dataTables_length')
        if(datatable.api().page.info().pages > 0) {
          paginateEle.show();
          tableLengthEle.show();
        }
        else {
          paginateEle.hide();
          tableLengthEle.hide();
        }

        //Set max colspan to the empty table message to fit content
        datatable.closest('.dataTables_wrapper').find('.dataTables_empty').attr('colspan', '100');

        //Set current page number to global object

        var currentPageNumber = getDTInstance(listing.index).DataTable.page.info().page;
        app.global.set("SEARCH_PAGING_"+currentRoute.originalPath, currentPageNumber);

        //Update page number on UI after search finished
        if(app.global.get("SEARCH_EVENT")) {
          app.global.set("SEARCH_EVENT", false)
          getDTInstance(listing.index).DataTable.page(0).draw(false);
        }
        $('#chk_hd_'+listing.index).prop('checked', false);
        $('.tooltip-inner').hide();
        $('.tooltip-arrow').hide();
        //Update default drawer menu based on table selection
        updateDrawerMenuButtons(listing.index);
      })
      .withOption('initComplete', function() {
        if(rowGrouping){
          getDTInstance(listing.index).dataTable.fnSetColumnVis(rowGrouping.col, false);
          // getDTInstance(listing.index).dataTable.find('tbody').on( 'click', 'tr.group', function () {
          //   var currentOrder = getDTInstance(listing.index).DataTable.order()[0];
          //   if ( currentOrder[0] === 0 && currentOrder[1] === 'asc' ) {

          //       getDTInstance(listing.index).DataTable.order( [ 0, 'desc' ] );
          //   }
          //   else {
          //       getDTInstance(listing.index).DataTable.order( [ 0, 'asc' ] );
          //   }
          // });
        }

        if(pageNumber > 0) {
          isInitDrawcallback = true;
          app.global.set("SEARCH_PAGING_"+currentRoute.originalPath, null);
        }
      })
      .withOption('createdRow', createdRow);
    if (typeof listing.paging !== typeof undefined) {
      if (!listing.paging) {
        options.withOption('paging', false);
        options.withOption('info', false);
      }
    }

    function createdRow(row, data, dataIndex) {
      var length = app.global.get(app.global.keys.PAGE_ENTRIES)
      if(listing.srNumber) {
        var pageNo = getDTInstance(listing.index).DataTable.page.info().page;

        var number = dataIndex + 1 + (length * pageNo)
        $(".sr-number", row).html(number);
      }
      compile(angular.element(row).contents())(scope);
    }

    function rowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
      // Unbind first in order to avoid any duplicate
      $('td', nRow).unbind('click');
      $('td', nRow).bind('click', function() {
        if (listing.onRowClick) {
          scope.$apply(function() {
            listing.onRowClick(nRow, aData, iDisplayIndex, iDisplayIndexFull);
          });
        }
      });
      return nRow;
    }

    scope.reloadData = function(index, listConfig) {
      if (typeof listConfig !== typeof undefined) {
        scope['config' + index] = listConfig
      }
      scope.pageScrollPos = $('div.dataTables_scrollBody').scrollTop();
      getDTInstance(index).dataTable.fnDraw(false);
    };

    scope.getTotalTableRecords = function(index) {
      return getDTInstance(index).dataTable.fnSettings().fnRecordsTotal();
    };
    return options;
  }

  app.setTitle = function(title){
    $('#basePageTitle').text(title);
    $(document).prop('title', title);
  }

  app.setParent = function(title){
    $(document).prop('title', title);
  }

  app.showMessage = function(id, type, msg, time) {
    $('#' + id).text(msg).removeClass()

    if (type == app.MsgType.Error) {
      $('#' + id).html(msg).addClass('alert alert-danger').show();
    } else {
      $('#' + id).html(msg).addClass('alert alert-success').show();
    }

    if (time) {
      setTimeout(function() {
        $('#' + id).hide()
      }, time * 1000);
    }
  };

  app.setDatePicker = function(){
      $('.datePicker').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        defaultDate: 'date',
      }).on('show', function(e) {
            setTimeout(function(){
                $('.datepicker').css('z-index', 99999999999999);
            }, 0);
      });

      $('.sp-daterange-picker').daterangepicker({
          showDropdowns: true,
          alwaysShowCalendars: true,
          autoUpdateInput: false,
          ranges: {
              'Today': [moment(), moment()],
              'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
              'Last 7 Days': [moment().subtract(6, 'days'), moment()],
              'Last 30 Days': [moment().subtract(29, 'days'), moment()],
              'This Month': [moment().startOf('month'), moment().endOf('month')],
              'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
              'This Year': [moment().startOf('year'), moment().endOf('year')],
              'Last Year': [moment().subtract(1, 'year').add(1,'day'), moment()]
          },
          locale: {
            cancelLabel: 'Clear'
        }
      });

      $('.sp-daterange-picker').on('apply.daterangepicker', function(ev, picker) {
        $(this).find('span').html(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
      });

      $('.sp-daterange-picker').on('cancel.daterangepicker', function(ev, picker) {
        $(this).find('span').html('');
      });
  };

  function searchbarEventsHandler($scope, $route) {
    $scope.$on('advanced-searchbox:leavedEditMode', function(event, searchParameter, tableIndex, cacheParam) {

      if(!$scope['searchParams'+tableIndex]) {
        return
      }

      $scope['searchParams'+tableIndex][searchParameter.key] = searchParameter.value;
      if (searchParameter['type'] == 'datePicker') {
          para_val = searchParameter.value.split('-');
          $scope['searchParams' + tableIndex][searchParameter.key + '_from_date'] = para_val[0];
          $scope['searchParams' + tableIndex][searchParameter.key + '_to_date'] = para_val[1];
      }

      if(cacheParam == "true") {
        app.searchCache.put($route.current.originalPath, {
          key: searchParameter.key,
          value: searchParameter.value
        });
      }

      app.global.set("SEARCH_EVENT", true)
      $scope.reloadData(parseInt(tableIndex));
    });

    $scope.$on('advanced-searchbox:removedSearchParam', function(event, searchParameter, tableIndex, cacheParam) {
      if(!$scope['searchParams'+tableIndex]) {
        return
      }
      delete $scope['searchParams'+tableIndex][searchParameter.key];

      if(cacheParam == "true") {
        app.searchCache.remove($route.current.originalPath, searchParameter.key);
      }

      app.global.set("SEARCH_EVENT", true)
      $scope.reloadData(parseInt(tableIndex));
    });

    $scope.$on('advanced-searchbox:removedAllSearchParam', function(event, tableIndex, cacheParam) {
      if(!$scope['searchParams'+tableIndex]) {
        return
      }
      $scope['searchParams'+tableIndex] = {};

      if(cacheParam == "true") {
        app.searchCache.removeAll();
      }

      app.global.set("SEARCH_EVENT", true)
      $scope.reloadData(parseInt(tableIndex));
    });

  }

  app.setup = function($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService) {

     function closeIframeCallback(data, tableIndex,is_reload) {
        if(is_reload == true){
          if (tableIndex > 0) {
            $scope.reloadData(tableIndex);
          }
          else if (tableIndex == 0 || typeof tableIndex == typeof undefined) {
            $route.reload();
          }
        }
        $('#loading-image').hide()
    }



    $scope.onEditLink = function(url, title, dialogCloseCallback, hasDomain, tableIndex,is_reload) {
      hasDomain = hasDomain || false;
      var openIframeDialog = openIframe(url, title, dialogCloseCallback, hasDomain, tableIndex, closeIframeCallback,is_reload);
      parent.globalIndex.iframeCloseCallback.push(openIframeDialog);
    }

    searchbarEventsHandler($scope, $route);
    $('.main-page-fav').show();
    $scope.$parent.childScope = $scope;

    $scope['getSelectedIds'] =  function(index) {
      return $scope['selected'+index];
    }

    var height = $(window).height() - ($('.nav_menu').outerHeight() + 45);
    if(config.pageTitle!= undefined && config.pageTitle!=''){
      app.setTitle(config.pageTitle);
      // var parent_menu = $('#sidebar-menu > div > ul > li.active > a').text()
      // if(parent_menu != '') {
      //   app.setParent(parent_menu)
      // }
    }

    var topActionbar = config.topActionbar;
    var listingAction = {
      selections: []
    }

    //setting up datepicker for all elements having "datePicker" class
    app.setDatePicker();

    $('.richtext').summernote({
        toolbar: [
            ['style', ['bold', 'italic', 'underline']],
            ['font', ['color']],
            ['fontsize', ['fontsize']],
        ]
    });

    //Configure top actionbar buttons
    if (topActionbar) {

      if (topActionbar.edit) {
        listingAction.selections.push({
          ngDisabled: 'btnModelEditDisable',
          multiselect: topActionbar.edit.multiselect
        });
      }

      if (topActionbar.delete) {
        listingAction.selections.push({
          ngDisabled: 'btnModelDeleteDisable',
          multiselect: (topActionbar.delete.multiselect === undefined ? true : topActionbar.delete.multiselect)
        });
      }

      $scope.addViewButtons($templateCache.get('top_action_bar'));

      // var modepara = '';
      // if(window.location.hash.split("/").length > 3)
      // {
      //   modepara = '?m=' + window.location.hash.split("/")[3];
      // }

      if (topActionbar.add) {
        $rootScope.onAdd = function(event) {
          window.location=(topActionbar.add.url + "0" +((topActionbar.add.filters != undefined && topActionbar.add.filters != '')? '?'+topActionbar.add.filters :''))
        }
        Mousetrap.bind('shift+a', $rootScope.onAdd);
      }

      if (topActionbar.edit) {
        $rootScope.onEdit = function(event) {
          $('input[type=checkbox]').mousedown(function (event) {
          // Toggle checkstate logic
            event.preventDefault(); // this would stop mousedown from continuing and would not focus
          });
          if($scope['selected1'][0] == undefined){
            sparrow.showMessage("appMsg", sparrow.MsgType.Error, 'Please select record', 5) ;
          }
          else if($scope['selected1'].length > 1){
            sparrow.showMessage("appMsg", sparrow.MsgType.Error, 'Please select only one record', 5) ;
          }
          else{
            app.redirect(topActionbar.edit.url + $scope['selected1'][0] +((topActionbar.edit.filters != undefined && topActionbar.edit.filters != '')? '?'+topActionbar.edit.filters :''));
          }

        }
        Mousetrap.bind('shift+e', $rootScope.onEdit);
      }

      if (topActionbar.delete) {
        $rootScope.onDelete = function(event) {
          var url = topActionbar.delete.url;
          var postData = {
            ids: $scope['selected'+app.tabIndex].join(",")
          }

          if(postData.ids == ''){
            sparrow.showMessage("appMsg", sparrow.MsgType.Error, 'Please select record', 5); ;
          }
          else{
            app.showConfirmDialog(ModalService, "Are you sure you want to delete record?", "Delete record", function(confirmAction){
              if(!confirmAction) {
                return;
              }
              app.post(url, postData, true, function(data) {
                $scope.clearSelection(1);
                $scope.reloadData(app.tabIndex);
                if (topActionbar.delete.callback) {
                  topActionbar.delete.callback(data);
                }
              });
            })
          }
        }
        Mousetrap.bind('shift+tab+d', $rootScope.onDelete);
      }
      //START: EXTRA BUTTONS SETUP
      if (topActionbar.extra) {

        multiEditSelectExtra = []
        multiSelectExtra = []

        btnExtra = topActionbar.extra;

        function getButton(id) {
          for (var i = 0; i < btnExtra.length; i++) {
            if (btnExtra[i].id == id) {
              return btnExtra[i];
            }
          }
        }

        for (var i = 0; i < btnExtra.length; i++) {
          var btn = btnExtra[i];
          if (btn.id) {

          $('.app-titlebar #'+btn.id).off('click');
          $('.app-titlebar #'+btn.id).on('click', function() {

              btn = getButton(this.id);
              if (btn.url) {
                var url = btn.url;

                if (!btn.noselect) {
                  ids = $scope['selected1'][0];

                  if (btn.multiselect) {
                    ids = $scope['selected1'].join("-")
                  }
                  url += ids;
                }

                app.redirect(url);
              }

              //Calling custom function defined in module js
              if (btn.function) {
                btn.function($rootScope);
              }
          });

            //Creating lising object that is used in selection data
            if (!btn.noselect) {
              var ngDisabled = $('#' + btn.id).attr("ng-disabled");
              if (ngDisabled) {
                listingAction.selections.push({
                  ngDisabled: ngDisabled,
                  multiselect: btn.multiselect
                });
              }
            }
          }
        }
      }
      //END: EXTRA BUTTONS
    }

    var allListing = config.listing;

    if (allListing) {
      tIndex = 0;

      var colOrderData = sparrow.global.get(sparrow.global.keys.USER_COL_SETTINGS) || [];

      var uiSettingsObj = {};
      for(var x=0; x < colOrderData.length; x++){
          uiSettingsObj[colOrderData[x].table_index+'-'+colOrderData[x].url] = JSON.parse(colOrderData[x].col_settings);
      }

      var originalCol = []
      var orginalColumn = {}
      for (var j = 0; j < allListing.length; j++) {
        orginalColumn[j] = [];
        originalCol[j] = {};
        for (var k = 0; k < allListing[j].columns.length; k++){
            orginalColumn[j].push(allListing[j].columns[k].name)
            originalCol[j][allListing[j].columns[k].name] = allListing[j].columns[k]
        }
      }

      var statUrl = (window.location.href.split("/#")[1]).replace(/[0-9]/g, '')
      for (var i = 0; i < allListing.length; i++) {
        var originalDisplayCol = []
        if(colOrderData.length > 0){
          var defaultColumns =  orginalColumn[i] //allListing[i].columns;
          var confingColLength = defaultColumns.length;
          var table_index = allListing[i].index != undefined ? allListing[i].index : 1;

          if(uiSettingsObj.hasOwnProperty(table_index+'-'+statUrl)){
            var dbCol = uiSettingsObj[table_index+'-'+statUrl];
            var hide_col = dbCol.hide_col;
            var userColumns = dbCol.col_order;

            var displayColumns = []
            //First set column on the same index in displayColumns array based on user defined sequences.
            for(var p=0; p<userColumns.length; p++) {
               if(defaultColumns.indexOf(userColumns[p]) > -1) {
                displayColumns.push(userColumns[p])
               }
             }

            //Insert new columns in the displayColumns array. There might be the columns which would added after user has saved setting.
            for(var q=0; q<defaultColumns.length; q++) {
              if(displayColumns.indexOf(defaultColumns[q]) == -1) {
                displayColumns.splice(q, 0, defaultColumns[q]);
              }
            }

            for(var r=0; r<displayColumns.length; r++) {
              originalDisplayCol.push(originalCol[i][displayColumns[r]])
            }
            for( var c=0 ; c < hide_col.length; c++){
              if(jQuery.inArray(hide_col[c], defaultColumns) !== -1){
                if(originalDisplayCol[userColumns.indexOf(hide_col[c])]["class"] == undefined) {
                  originalDisplayCol[userColumns.indexOf(hide_col[c])]["class"] = "col-hide"
                }
                else{
                  originalDisplayCol[userColumns.indexOf(hide_col[c])]["class"] += " col-hide "
                }
              }
            }

            allListing[i].columns = originalDisplayCol;
          }
        }
        var listing = allListing[i]
        //tIndex += 1;

        tIndex = listing.index;

        //START: ADD SEARCH PARAMETERS
        if (listing.search && listing.index) {
            $scope['availableSearchParams'+listing.index] = [];

            for (var j = 0; j < listing.search.params.length; j++) {
              $scope['availableSearchParams'+listing.index].push(listing.search.params[j]);
            }

            /*
              Set previous serach result from stored search param values.
            */
            var searchCacheParams = app.searchCache.get($route.current.originalPath)

            $scope['searchParams'+listing.index] = {};
            //TODO: searchParameter should be based on table index for different tables
            $scope.searchParameter = {};
            for (var j = 0; j < listing.search.params.length; j++) {
                if ('default_val' in listing.search.params[j]) {
                    $scope['searchParams' + listing.index][listing.search.params[j]['key']] = listing.search.params[j]['default_val'];
                }
            }

            $.each(searchCacheParams, function(key, value) {
              if(value == "##" && key != $route.current.originalPath) {
                $scope.searchParameter = {};
                $scope['searchParams'+listing.index] = {};
              }
              else {
                $scope['searchParams'+listing.index][key] = value;
                $scope.searchParameter[key] = value;
              }
            });
        }

        //END: SEARCH PARAMETER
        var listingObj = {
          selections: listingAction.selections,
          index: tIndex,
          uIndex: listing.index || tIndex,
          url: listing.url,
          paging: listing.paging,
          displayLength: (listing.displayLength || app.global.get(app.global.keys.DISPLAY_ROW) || 10 ),
          srNumber: (listing.srNumber || false),
          crud: listing.crud,
          inlineCrud: listing.inlineCrud,
          selectionCallback: listing.selectionCallback,
          scrollBody: (listing.scrollBody || false),
          footerClass: (listing.footerClass || ''),
          reOrder: (listing.reOrder == undefined ? true : listing.reOrder),
          rowGrouping : (listing.rowGrouping == undefined ? false : listing.rowGrouping),
          emptyTblMsg: (listing.emptyTblMsg || "No data available in table"),
          additionalSearchParams: listing.additionalSearchParams || []
        };

        if (listing.onRowClick) {
          listingObj['onRowClick'] = listing.onRowClick;
        }

        if(listing.postData) {
          listingObj['postData'] = listing.postData;
        }

        function onBind(data) {
          if (data.code == 0) {
            sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
          }

          //Calling callback function if specified after datatable binding
          $.grep(Object.keys(allListing), function (k) {
            if(allListing[k].index == data.index) {
              if(allListing[k].onBindCallback) {
                  allListing[k].onBindCallback(data);
              }
            }
         })
        }

        //BIND DATATABLE
        $scope['dtOptions' + tIndex] = app.setDatatable(onBind, $compile, DTOptionsBuilder, $scope, $rootScope, $route.current, listingObj, allListing, ModalService);

        //START: DATATABLE COLUMNS SETUP
        $scope['dtColumns' + tIndex] = [];

        var idColumn = false;
        if (listing.crud) {
          var chkHeaderId = "chk_hd_"+tIndex;
          idColumn = DTColumnBuilder.newColumn(null).withTitle('<input class="allListing'+tIndex+' magic-checkbox"  id="'+chkHeaderId+'"  type="checkbox"  ng-click="selectAll(' + tIndex + ', $event)"><label for="'+chkHeaderId+'" style="display: inline-block;"></label>').notSortable().renderWith(function(data, type, full, meta) {
            var instanceId = $(meta.settings.nTable).attr('dt-instance').replace ( /[^\d.]/g, '' );
            var chkId = "chk_"+instanceId+"_"+data.id;
            return '<input type="checkbox" id="'+chkId+'"  class="magic-checkbox"  ng-checked="isSelected(' + instanceId + ', ' + data.id + ')" ng-click="updateSelection(' + instanceId + ', $event, ' + data.id + ')" ref=' + data.id + ' /><label for="'+chkId+'" style="display: inline-block;"></label>';
          });
        }

        if (listing.inlineCrud) {
          idColumn = DTColumnBuilder.newColumn('id').notVisible();
        }

        if (idColumn === undefined) {
          console.log("Id column is not defined. Make sure you have not supplied id columns otherwise data columns mismatched and error occurrs in data binding.")
        }

        if (idColumn) {
          $scope['dtColumns' + tIndex].push(idColumn);
        }

        if (listing.srNumber) {
          var srNumberColumn = DTColumnBuilder.newColumn(null).withTitle('Sr No').withClass('sr-number').withOption('defaultContent', ' ').notSortable();
          $scope['dtColumns' + tIndex].push(srNumberColumn);
        }
        // $scope['dtColumns' + tIndex].push(DTColumnBuilder.newColumn(null).withTitle('Sr No').withOption('defaultContent', ' ').notSortable())

        for (var k = 0; k < listing.columns.length; k++) {
          var listColumn = listing.columns[k];

          var column = DTColumnBuilder.newColumn(listColumn.name).withOption('type', 'num');
          column.withTitle(listColumn.title);
          if(listColumn.class){
              column.withClass(listColumn.class);
          }

          if (listColumn.renderWith) {
            column.renderWith(listColumn.renderWith);
          }

          var colIndex = k;
          if (idColumn) {
            colIndex = k+1;
          }
          if (listing.srNumber) {
            colIndex = k+2;
          }

          //START: LINK FOR OPEN NEW MODULE
          if(listColumn.link) {
            $scope['colDataEdit' + (i+1) +colIndex] = listColumn;
            column.renderWith(function(data, type, full, meta) {
              var instanceId = $(meta.settings.nTable).attr('dt-instance').replace ( /[^\d.]/g, '' );
              var colDataEdit = $scope['colDataEdit' + instanceId+meta.col];
              var colLinkData = colDataEdit.link
              var dialog = colLinkData.dialog == undefined ? false : colLinkData.dialog;
              var iframeTitle = colDataEdit.title;
              var linkTitleKey =  'title' in colLinkData.params ? colLinkData.params['title'] : undefined;
              //Clone object
              var colLinkDataValue = JSON.parse(JSON.stringify(colLinkData));
              for(param in colLinkData.params) {
                var colName = colLinkData.params[param];
                colLinkDataValue.params[param] = full[colName]
              }
              var route = app.getRoute($route, colLinkDataValue);
              if(colLinkData.title){
                data = colLinkData.title;
              }
              var filters='';
              if(colLinkData.filters){
                filters = '?'+colLinkData.filters;
              }
              var new_tab = '_self';
              if(colLinkData.new_tab){
                new_tab = '_blank'
              }

              if(dialog) {
                  var url = "/b/iframe_index/#"+route+filters
                  return '<a class="link-iframe-item" ng-click="onEditLink(\''+url+'\',\''+iframeTitle + ' - ' + full[linkTitleKey] +'\','+null+', '+false+', '+instanceId+')">'+data+'</a>';
              }
              return '<a href="#'+route+filters+'" target='+new_tab+'>'+data+'</a>';
            });
          }
          //END: LINK FOR OPNE NEW MODULE

          if(listColumn.onEdit) {
            $scope['colDataEdit' + (i+1) +colIndex] = listColumn;
            column.renderWith(function(data, type, full, meta) {
                var instanceId = $(meta.settings.nTable).attr('dt-instance').replace ( /[^\d.]/g, '' );
                var colData = $scope['colDataEdit' + instanceId + meta.col];
                var type = colData.onEdit.type ? colData.onEdit.type : 'text'
                $scope['rowData' + instanceId][full.id] = full
                return '<div class="mouseover-edit-col" id="'+full.id+'" name="'+colData.name+'" title="Edit item" instance="'+instanceId+'" col='+meta.col+' >\
                            <span id="'+colData.name+'_'+full.id+'">'+data+'</span>\
                            <input type="'+type+'" class="input-edit-link" id="input_'+colData.name+'_'+full.id+'" value="'+data+'">\
                            <i class="icon-pencil-1 cell-edit-icon" id="icon_'+colData.name+'_'+full.id+'"></i>\
                        </div>';
            });
            column.sClass = column.sClass + " edit-link"
          }

          if (listColumn.sort !== undefined && !listColumn.sort) {
            column.notSortable();
          }

          $scope['dtColumns' + tIndex].push(column);
        }

        // if (listing.inlineCrud) {

        //   function actionsHtml(data, type, full, meta) {
        //     var index = data.index || 1;
        //     $scope['rowData' + index][data.id] = data;
        //     var template = "";
        //     // if (listing.inlineCrud.edit) {
        //       template += '<div class="pull-right"><i class="icon-pencil-1 list-btn" ng-click="inlineEdit(' + index + ',' + data.id + ')"></i>&nbsp;';
        //     // }
        //     // if (listing.inlineCrud.delete) {
        //       template += '<div class="pull-right"><i class="icon-trash list-btn" ng-click="inlineDelete(' + index + ',' + data.id + ')"></i>&nbsp;';
        //     // }

        //     return template;
        //   }

        //   $scope['dtColumns' + tIndex].push(DTColumnBuilder.newColumn(null).notSortable().renderWith(actionsHtml));
        // }
        //END: DATATABLE COLUMN SETUP

      }
    } //allListing if ends

    var height = $(window).height() - ($('.nav_menu').outerHeight() + 60);
    if(app.inIframe()) {
      height = height + 45;
      if ($('.icon-arrow-1-left').length != 0){
        height = height - 22
      }
    }
    if($('.details-footer').length != 0) {
      var totalHeight = height - ($('.details-footer').height() + 30);
      $('.details-body').css({"height": totalHeight + "px","overflow": "auto" })
    }

    if($('.details-footer').length != 0 && $('ang-subscriptions').length != 0) {
      var totalHeight = height - ($('.details-footer').height() + 42);
      $('.details-body').css({"height": totalHeight + "px","overflow": "auto" })
    }
    if (allListing) {
      tIndex = 0;

      for (i = 0; i < allListing.length; i++) {
        //tIndex += 1;
        listing = allListing[i]
        tIndex = listing.index;

        if (listing.inlineCrud) {
          var isEdit = true;// listing.inlineCrud.edit;
          var isDelete = true;//listing.inlineCrud.delete;


          function actionsHtml(data, type, full, meta) {
            var instanceId = $(meta.settings.nTable).attr('dt-instance').replace ( /[^\d.]/g, '' );
            $scope['rowData' + instanceId][data.id] = data;
            var template = "";
             if (isEdit) {
              template += '<div class="pull-right" style="width: 65px;" id="'+data.id+'_inline_crud"><i class="icon-pencil-1 list-btn" ng-click="inlineEdit(' + instanceId + ',' + data.id + ')"></i>&nbsp;';
             }
             if (isDelete) {
              template += '<div class="pull-right"><i class="icon-trash list-btn" ng-click="inlineDelete(' + instanceId + ',' + data.id + ')"></i>&nbsp;';
             }
            return template;
          }
          $scope['dtColumns' + tIndex].push(DTColumnBuilder.newColumn(null).withTitle('<span style="padding-right:65px;"></span>').withClass('text-right').notSortable().renderWith(actionsHtml));
          // $scope['dtColumns' + tIndex].push(DTColumnBuilder.newColumn(null).withClass('inline-edit-delete').notSortable().renderWith(actionsHtml));
        }

      }

      $('#app_container').css({
        "max-height": height + 25 + "px",
        "height": height + 25 + "px",
        "overflow": "auto"
      })
    }
    else {
      $('#app_container').css({
        "max-height": height+ 10 + "px",
        "height": height+ 10 + "px",
        "overflow": "auto"
      });
    }

    $('#app_container').off('mouseover', '.edit-link');
    $('#app_container').on('mouseover', '.edit-link', function() {
        var id = $(this).children().attr('name') + "_" + $(this).children().attr('id');
        if($(this).find("#input_" + id + ":visible").length == 0){
          $('#icon_'+id).show();
        }
    })

    $('#app_container').off('mouseout', '.edit-link');
    $('#app_container').on('mouseout', '.edit-link', function() {
        var id = $(this).children().attr('name') + "_" + $(this).children().attr('id');
        $('#icon_'+id).hide();
    });

    $('#app_container').off('click', '.edit-link');
    $('#app_container').on('click', '.edit-link', function(data) {
        var colData = $scope['colDataEdit' + $(this).children().attr('instance') + $(this).children().attr('col')];
        var id = $(this).children().attr('name') + "_" + $(this).children().attr('id');
        var rowData = $scope['rowData' + $(this).children().attr('instance')][$(this).children().attr('id')]
        if(colData.onEdit.inline == 'true') {
          var oldValue = $('#input_'+id).val();
          $('#input_'+id).show();
          $('#input_'+id).focus();
          $('#input_'+id).select();
          $('#icon_'+id).hide();
          $('span[id="'+id+'"]').hide();

          $(this).off('focusout keydown', '#input_'+id);
          $(this).on("focusout keydown", '#input_'+id, function (e) {
              if(e.keyCode == 27) {
                  $('span[id="'+id+'"]').text(oldValue);
                  $('#input_'+id).val(oldValue);
                  $('#input_'+id).hide();
                  $('span[id="'+id+'"]').show();
                  $('.edit-link').unbind('focusout');
              }
              else if (e.type == "focusout" || e.keyCode == 13) {
                  if(e.keyCode == 13){
                      $('.edit-link').unbind('focusout');
                  }

                  if(colData.onEdit.url) {
                    postCellValue(id, colData, rowData);
                  }
                  else if(colData.onEdit.callback) {
                    $('span[id="'+id+'"]').text($('#input_'+id).val());
                    colData.onEdit.callback($('#input_'+id).val(), rowData, {});
                  }
                  else {
                    $('span[id="'+id+'"]').text($('#input_'+id).val());
                  }

                  $('#input_'+id).hide();
                  $('span[id="'+id+'"]').show();
              }
          });
        }
        else if(colData.onEdit.callback) {
          colData.onEdit.callback($('#input_'+id).val(), rowData, {});
        }
    })

    function postCellValue(id, colData, rowData) {
      var url = colData.onEdit.url ? colData.onEdit.url : '';
      var inline = colData.onEdit.inline ? colData.onEdit.inline : '';
      if($('span[id="'+id+'"]').text() != $('#input_'+id).val()) {
        var postData = {
          id : id.split("_").reverse()[0],
          value : $('#input_'+id).val()
        }
        sparrow.post(url, postData, false, function(data){
          if(data.code == 1) {
            $('span[id="'+id+'"]').text($('#input_'+id).val());
            if(colData.onEdit.callback) {
              colData.onEdit.callback($('#input_'+id).val(), rowData, data);
            }
          }
          else{
            $('#input_'+id).val($('span[id="'+id+'"]').text());
            app.showMessage("appMsg", data.code, data.msg, 5);
          }
        });
      }
    }
  };

  app.showAttachments = function(ModalService, objectId, appName, modelName) {
    ModalService.showModal({
      templateUrl: "/attachment/dialog_template/",
      controller: "AttachmentController",
      inputs: {
        objectId: objectId,
        appName: appName,
        model: modelName,
        title: "Attach file(s)",
      }
    }).then(function(modal) {
      modal.element.modal();

      //TODO: Removed extra added 4 blocking model layers. Need to find proper way.
      $('.modal-backdrop').each(function(i, obj) {
          if(!$(obj).hasClass('fade'))
            $(obj).remove();
      });
      modal.close.then(function(result) {});
    });
  }

  app.showImportDialog = function(ModalService, modelName, title, postUrl, descr, id, callback, extraData){
    ModalService.showModal({
      templateUrl: "/baseimport/load_import_template/"+modelName+"/",
      controller: "ImportController",
      inputs: {
        model: modelName,
        title: title,
        postUrl: postUrl,
        descr: descr,
        callback: callback,
        id: id,
        keyboard: false,
        extraData: extraData
      }
    }).then(function(modal) {
      modal.element.modal();
      $('.modal-backdrop').each(function(i, obj) {
          if(!$(obj).hasClass('fade'))
            $(obj).remove();
      });
      modal.element.one('hidden.bs.modal', function () {
          $('.modal-backdrop').remove();
      });
      modal.close.then(function(result) {});
    });
  }

  app.showMailScreen = function(ModalService, title, appName, model, attachments, entityId, mailSendURL, toEmails,cc_mails, emailTeplate,skipMailURL,orderType,callback){
      ModalService.showModal({
        templateUrl: "/mails/mail_screen/",
        controller: "MailScreenController",
        inputs: {
          title: title,
          appName : appName,
          model: model,
          entityId: entityId,
          attachments : attachments,
          mailSendURL : mailSendURL,
          toEmails :toEmails ,
          cc_mails: cc_mails,
          emailTeplate : emailTeplate,
          skipMailURL : skipMailURL,
          orderType : orderType,
          callback: callback
        }
      }).then(function(modal) {
        modal.element.modal();
        $('.modal-backdrop').each(function(i, obj) {
            if(!$(obj).hasClass('fade'))
              $(obj).remove();
        });
        $('.mail-from-sendmail').attr('action',mailSendURL);
        $('.mail-to-user').val(toEmails);
        $('.mail-subject').val(emailTeplate.subject);
        $('.richtext').val(emailTeplate.template);
        $('.richtext').summernote({
              toolbar: [
                  ['style', ['bold', 'italic', 'underline']],
                  ['font', ['color']],
              ],
              height: 200,
              minHeight: 200,
              maxHeight: 200,
        });
        modal.element.one('hidden.bs.modal', function () {
            $('.modal-backdrop').remove();
            modal.element.remove();
        });

        modal.close.then(function(result) {});
      });
  }

  app.showTrackingInDialog = function(ModalService, title, url, modelName, id, qty, callback, data, templateCache){
    qty = qty != null ? qty : 0 ;
    ModalService.showModal({
      templateUrl: "/inventory/tracking_in/"+modelName+"/"+id+"/"+qty+"/",
      controller: "TrackingInController",
      inputs: {
        title: title,
        model: modelName,
        url: url,
        id: id,
        qty: qty,
        callback:callback,
        uploadData: data,
      }
    }).then(function(modal) {

      setAutoLookup('warehouse_location_id','/b/lookups/warehouse_location/', '');

      //Remove template from cache
      if(templateCache) {
        templateCache.remove("/inventory/tracking_in/"+modelName+"/"+id+"/"+qty+"/");
      }

      modal.element.modal();
      $('.modal-backdrop').each(function(i, obj) {
          if(!$(obj).hasClass('fade'))
            $(obj).remove();
      });
      modal.close.then(function(result) {});
      var height = $(window).height() - 190;
      $('.prod_info').css({
        "height": height + "px",
        "overflow": "auto"
      });

      modal.element.on('shown.bs.modal',function(){

          sparrow.post('/inventory/get_current_serial/', {}, false, function(data) {
            if(data.code == 1) {
              var serial = data.serial;
              var prefix = data.prefix;
              $('input.serial-input').each(function(){
                  var strSerial = ""+serial
                  var new_serial =  prefix + ('0000000000'+strSerial).substring(strSerial.length);
                  $(this).val(new_serial);
                  serial = serial + 1;
              });
            }
          }, 'json');
      });
      modal.element.one('hidden.bs.modal', function () {
          $('.modal-backdrop').remove();
      });

    });
  }

  app.showTrackingOutDialog = function(ModalService, title, url, modelName, id, qty, callback, uploadData, templateCache){
    $('#loading-image').show();
    ModalService.showModal({
      templateUrl: "/inventory/tracking_out/"+modelName+"/"+id+"/"+qty+"/",
      controller: "TrackingOutController",
      inputs: {
        title: title,
        model: modelName,
        url: url,
        id: id,
        qty: qty,
        callback:callback,
        uploadData: uploadData,
      }
    }).then(function(modal) {
      // Remove template from cache
      if(templateCache) {
        templateCache.remove("/inventory/tracking_out/"+modelName+"/"+id+"/"+qty+"/");
      }
      modal.element.modal();
      $('#loading-image').hide();
      $('.modal-backdrop').each(function(i, obj) {
          if(!$(obj).hasClass('fade'))
            $(obj).remove();
      });
      modal.close.then(function(result) {});

      var height = $(window).height() - 190;
      $('.stock_location').css({
        "height": height + "px",
        "overflow": "auto"
      });

      modal.element.on('shown.bs.modal',function(){
        barcodes_serialLot = null;

        //If below click event is outside of iframe model then default modal cancel event fire.
        $(this).on('click', function(e) {
          if($(this).closest(e.target).length) {
            modal.scope.cancel();
            $(this).off('click');
          }
        });

        $(document).scannerDetection({
              onComplete: function(barcode, qty){
                  validScan = true;
                  barcodes_serialLot = barcode;
                  selectLotByScan(barcodes_serialLot)
              }
          });

          function selectLotByScan(barcodes_serialLot){
            if($('div.product-name h4').length > 0){
            $('div.product-name h4').each(function(){
                  var productId = $(this).attr('data-product-id');
                  var lineId = $(this).attr('data-line-id');
                  var requiredQty = $('div[data-product-id="'+productId+'"][data-line-id="'+lineId+'"]').text();
                  if($.isNumeric(requiredQty) && $.isNumeric(requiredQty) > 0){
                      requiredQty = +requiredQty;
                      var lots = $('label.stock-qty[data-product-id="'+productId+'"][data-line-id="'+lineId+'"]').sort(function(a, b) {
                          return +a.textContent - +b.textContent;
                      });

                      $(lots).each(function(){
                          var lotId = $(this).attr('data-id');
                          var lotQty = $('label.stock-qty[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').text();
                          var serial_lot_number = $('label.serial-num[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').text();
                          if($.isNumeric(lotQty) && $.isNumeric(lotQty) > 0){
                            if(serial_lot_number == barcodes_serialLot){
                              $('input.lot-number[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').attr('checked', 'checked');
                              $('#row'+lotId).css('background', '#c0f5b7');
                              var rowpos = $('#row'+lotId).position();
                              rowpos.top = rowpos.top - 50;
                              $('.modal-body').animate({scrollTop: rowpos.top}, 1000);
                            }
                          }
                      });
                  }

              });
          }
        }

        function showLot(is_all) {
          if(is_all) {
            $('.hide-style').addClass('show-style');
            $('.hide-style').removeClass('hide-style');
            $('#in_stock_exist_location').show();
            $('#no_stock_exist_location').hide();
            in_stock_exist_location = true;
          }
          else {
            $('.show-style').addClass('hide-style');
            $('.show-style').removeClass('show-style');
            $('.match-lot').addClass('show-style');
            $('.match-product').addClass('show-style');
            $('input.lot-number').each(function() {
                if(!$(this).hasClass('match-checkbox')) {
                  $(this).removeAttr('checked');
                }
            })
          }
        }
        var in_stock_exist_location = false;
        $('#show_other_location_view').click(function() {
          showLot(true);
        })

        $("#show_all_location").change(function() {
          showLot(this.checked);
        })

          if($('div.product-name h4').length > 0){
            var warehouseLocationId = $('#id_parts_location').attr('value');
            var duplicateWareHouseLocId = $('#id_duplicate_part_loc').attr('value'); // Remove warehouse loc EC specific code
            $('div.product-name h4').each(function(){
                  var productId = $(this).attr('data-product-id');
                  var lineId = $(this).attr('data-line-id');
                  var requiredQty = $('div[data-product-id="'+productId+'"][data-line-id="'+lineId+'"]').text();
                  var modelList = ['mfg_order', 'inspection', 'stock_move', 'order']
                  var isGenericGroup = $(this).attr('generic-group') == 'true' ? true : false;
                  var is_available = false;
                  if($.isNumeric(requiredQty) && $.isNumeric(requiredQty) > 0){
                      requiredQty = +requiredQty;
                      var lots = $('label.stock-qty[data-product-id="'+productId+'"][data-line-id="'+lineId+'"]').sort(function(a, b) {
                          return +a.textContent - +b.textContent;
                      });
                      $(lots).each(function(){
                          var lotId = $(this).attr('data-id');
                          // var lotQty = $('label.stock-qty[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').text();
                          var lotQty = $('input.lot-number[data-id="'+lotId+'"][data-product-id="'+productId+'"]').attr('remaining-qty');
                          var serial_lot_number = $('label.serial-num[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').text();
                          var reservedTrackingStr = $('#reservedTrackingStr').attr('refrence');
                          var reservedTrackingNumbers = reservedTrackingStr.split(',');

                            if($.isNumeric(lotQty) && $.isNumeric(lotQty) > 0 && parseInt(lotQty) > 0){
                              // Auto select tracking numbers based on availble qty per serial/lot.
                              // if(modelName == "mfg_order" || modelName == "inspection" || modelName == "stock_move"){
                              if(modelList.indexOf(modelName) >= 0) {
                                if(requiredQty > 0){
                                  if(modelName == "mfg_order" && $('#id_is_sale_order').attr('value') != '') {
                                    if(isGenericGroup) {
                                      $('input.lot-number[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').attr('checked', 'checked');
                                      $('#row'+lotId+'[data-line-id="'+lineId+'"]').prependTo('.serialLotRows'+productId+'[data-line-id="'+lineId+'"]');
                                      // $('#row'+lotId).addClass('match-lot');
                                      $('.serialLotRows'+productId +' > .row').addClass('match-lot');
                                      $('input.lot-number[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').addClass('match-checkbox');
                                      is_available = true;
                                      in_stock_exist_location = true;
                                    }
                                    else if($('label.warehouse-location[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').attr('value') == $('#id_parts_location').attr('value') ||
                                      $('label.warehouse-location[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').attr('value') == duplicateWareHouseLocId
                                      ){

                                      if($('#row'+lotId).attr('warehouse-location') != ''){
                                        $('input.lot-number[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').attr('checked', 'checked');
                                      }

                                      $('#row'+lotId+'[data-line-id="'+lineId+'"]').prependTo('.serialLotRows'+productId+'[data-line-id="'+lineId+'"]');
                                      // $('#row'+lotId).addClass('match-lot');
                                      $('.serialLotRows'+productId +' > .row[warehouse-location="'+warehouseLocationId+'"]').addClass('match-lot');
                                      $('input.lot-number[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').addClass('match-checkbox');
                                      is_available = true;
                                      in_stock_exist_location = true;
                                    }
                                    else {
                                      requiredQty = requiredQty + +lotQty
                                    }
                                  }
                                  else {
                                    $('input.lot-number[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').attr('checked', 'checked');
                                    $('#row'+lotId+'[data-line-id="'+lineId+'"]').prependTo('.serialLotRows'+productId+'[data-line-id="'+lineId+'"]');
                                    in_stock_exist_location = true;
                                  }
                                }
                                var remainingQty = $('input.lot-number[data-id="'+lotId+'"][data-product-id="'+productId+'"]').attr('remaining-qty');
                                remainingQty = remainingQty <= requiredQty ? 0 : remainingQty - requiredQty;
                                $('input.lot-number[data-id="'+lotId+'"][data-product-id="'+productId+'"]').each(function() {
                                  $(this).attr('remaining-qty', remainingQty)
                                })
                                requiredQty = requiredQty - +lotQty;
                              }
                              // Select already reserved tracking numbers.
                              else if(modelName == "transfer_order"){
                                var result = reservedTrackingNumbers.includes(serial_lot_number);
                                if(result){
                                  $('input.lot-number[data-id="'+lotId+'"][data-line-id="'+lineId+'"]').attr('checked', 'checked');
                                  $('#row'+lotId+'[data-line-id="'+lineId+'"]').prependTo('.serialLotRows'+productId+'[data-line-id="'+lineId+'"]');
                                }
                              }
                          }

                          if(requiredQty <= 0){
                              return;
                          }
                      });
                  }
                  if(modelName == "mfg_order" && $('#id_is_sale_order').attr('value') != '' && is_available) {
                    $('div.row[id="product'+productId+'"]').addClass('match-product');
                    $('div.row[id="border'+productId+'"]').addClass('match-product');
                  }
            });
            if(modelName == "mfg_order" && $('#id_is_sale_order').attr('value') != '') {
              showLot(false);
            }
            else {
              showLot(true);
            }
            if(!in_stock_exist_location){
              $('#no_stock_exist_location').show();
            }
            else {
              $('#in_stock_exist_location').show();
            }
          }
      });
           modal.element.one('hidden.bs.modal', function () {
              $('.modal-backdrop').remove();
          });

    });
  }

  app.showSelectLotDialog = function(ModalService, title, url, modelName, id, qty, callback, data){
    qty = qty != null ? qty : 0 ;
    ModalService.showModal({
      templateUrl: "/inventory/select_lot/"+modelName+"/"+id+"/"+qty+"/",
      controller: "SelectLotController",
      inputs: {
        title: title,
        model: modelName,
        url: url,
        id: id,
        qty: qty,
        callback:callback,
        uploadData: data,
      }
    }).then(function(modal) {
      modal.element.modal();
      $('.modal-backdrop').each(function(i, obj) {
          if(!$(obj).hasClass('fade'))
            $(obj).remove();
      });
      modal.close.then(function(result) {});
      var height = $(window).height() - 190;
      $('div.modal-body').css({
        "height": height + "px",
        "overflow": "auto"
      });

       modal.element.on('shown.bs.modal',function(){
          $("input:radio[name=trackNumber]:first").attr('checked', true);
       });
        modal.element.one('hidden.bs.modal', function () {
            $('.modal-backdrop').remove();
        });
    });
  }

  app.toSEOUrl = function(url){
    // make the url lowercase
    var encodedUrl = url.toString().toLowerCase();
    // replace & with and
    encodedUrl = encodedUrl.split(/\&+/).join("-and-")
    // remove invalid characters
    encodedUrl = encodedUrl.split(/[^a-z0-9]/).join("-");
    // remove duplicates
    encodedUrl = encodedUrl.split(/-+/).join("-");
    // trim leading & trailing characters
    encodedUrl = encodedUrl.trim('-');
    return encodedUrl;
  }

  app.getQueryStringParams = function(sParam){
      var sPageURL = '';
      if(window.location.href.indexOf('?') > -1){
          sPageURL = window.location.href.slice(window.location.href.indexOf('?') + 1);
      }
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++)
      {
          var sParameterName = sURLVariables[i].split('=');
          if (sParameterName[0] == sParam)
          {
              return sParameterName[1];
          }
      }
  }

  app.inIframe = function() {
      try {
          return window.self !== window.top;
      } catch (e) {
          return true;
      }
  }

  app.getDomainName = function() {
    return window.location.protocol+'//'+window.location.hostname+(window.location.port ? ':'+window.location.port: '');
  }

  app.stripHtml = function(html) {
      var tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText;
  }

var openIframe = function(src, title, closeDialogCallback, hasDomain, tableIndex, closeIframeCallback,is_reload) {
    hasDomain = hasDomain || false;

    var ttlOpenWindow = parent.$('.frame-dialog').length;
    var iframeModelId = 'iframe_model'+ttlOpenWindow;
    var iframeTitleId = 'iframe_title'+ttlOpenWindow;
    var iframeCloseId = 'iframe_close'+ttlOpenWindow;
    var iframeId = 'iframe'+ttlOpenWindow;

    var iframeHTML = '<div id="'+iframeModelId+'"  class="modal fade frame-dialog" tabindex="-1" role="dialog" data-keyboard="false"  data-backdrop="static">\
                          <div class="modal-dialog modal-lg" role="document">\
                              <div class="modal-content">\
                                  <div class="modal-header">\
                                      <button type="button" id="'+iframeCloseId+'"  class="close" data-dismiss="modal" aria-label="Close">\
                                          <span aria-hidden="true">&times;</span>\
                                      </button>\
                                      <h5 class="modal-title" id="'+iframeTitleId+'"></h5>\
                                  </div>\
                                  <div class="modal-body">\
                                      <iframe src="" id="'+iframeId+'"></iframe>\
                                  </div>\
                              </div>\
                          </div>\
                      </div>';

    parent.$("body").append(iframeHTML);

    if(ttlOpenWindow > 0) {
        title = parent.$('#iframe_title'+(parseInt(ttlOpenWindow) - 1)).html() + "&nbsp;<i class='icon-arrow-1-right'>&nbsp;</i>" + title;
    }
    else {
        title = $('#basePageTitle').html() + "&nbsp;<i class='icon-arrow-1-right'>&nbsp;</i>" + title;
    }
    parent.$('#'+iframeId).css('height', (parent.document.body.clientHeight-150)+'px');

    if (!hasDomain) {
      src = app.getDomainName() + src;
    }

    parent.$('#'+iframeId).attr("src", src);
    parent.$('#'+iframeModelId).modal('show');
    parent.$('#'+iframeTitleId).html(title);

    var closeDialog = function(newTitle, dataObject) {
      newTitle = newTitle || '';
      $('#loading-image').hide();
      if (newTitle != ''){
        if(ttlOpenWindow > 0) {
            newTitle = parent.$('#iframe_title'+(parseInt(ttlOpenWindow) - 1)).html() + "&nbsp;<i class='icon-arrow-1-right'>&nbsp;</i>" + newTitle;
        }
        else {
            newTitle = $('#basePageTitle').html() + "&nbsp;<i class='icon-arrow-1-right'>&nbsp;</i>" + newTitle;
        }

        parent.$('#'+iframeTitleId).html(newTitle);
        return;
      }

      parent.$('#'+iframeModelId).remove();
      parent.$('.modal-backdrop').each(function(i, obj) {
          if (i === parent.$('.modal-backdrop').length - 1){
            $(obj).remove();
          }
      });

      if(closeDialogCallback) {
        parent.$('#'+iframeId).attr('src','about:blank');
        closeDialogCallback(dataObject, tableIndex);
      }
      closeIframeCallback(dataObject, tableIndex,is_reload);
    }

    parent.$('#'+iframeCloseId).off();
    parent.$('#'+iframeCloseId).click(function(){
      parent.$('#'+iframeId).attr('src','about:blank');
        closeDialog();
    });

    parent.$('#'+iframeModelId).on('hidden',function(e){
        $(this).remove();
    });

    return closeDialog;
  }
  app.setIframeTitle = function(title) {
    if(app.inIframe() && parent.globalIndex.iframeCloseCallback.length > 0) {
      var iFrameCloseCallback =  parent.globalIndex.iframeCloseCallback[parent.globalIndex.iframeCloseCallback.length - 1];
      iFrameCloseCallback(title);
    }
  }

  app.configColumnMove = function(direction) {
    var current = $('#colReorder_model .selectedConfigColumn');
    if (direction == 'up'){
      current.prev().before(current);
    }
    else{
      current.next().after(current);
    }

  }

  app.saveColumnConfig = function(){
    var colOrder = [];
    var checkOrder = [];
    var tableColIndex = parseInt($('#colReorder_form').attr('index'));
    $("#idColumnReorderDiv .configColumn").each(function(){
      var colName = $(this).attr('column-name');
      colOrder.push(colName);
      var checkbox = $(this).find('input').first()
      if (!checkbox.is(':checked')){
        checkOrder.push(colName);
      }
    })

    var totalHiddencols = $('#reorderCallHidden').text();

    if(totalHiddencols != ''){
      var newColOrder = colOrder.concat(totalHiddencols.split(",").map(Number))
    }
    else{
      newColOrder = colOrder
    }

    var url = window.location.href.split("/#")[1];
    var digitRegx = /[0-9]/g;
    var newUrl = url.replace(digitRegx,'');
    var postData = {
      colOrder: newColOrder.join([separator = ',']),
      url : newUrl,
      tableColIndex: tableColIndex,
      checkOrder : checkOrder.join([separator = ',']),
    }
    sparrow.post("/base/set_col_order/", postData, false, function(data) {
      if(data.code == 0){
        console.log(data.msg);
      }
      else{
        $('#colReorder_model').modal('hide');
        location.reload();
      }
    })
  }

  app.showModal = function(opt) {
      function showDialog(template) {
        var dialogElement = $(template);
        option.compile(dialogElement)(option.scope.$new());
        $("body").append(dialogElement)
        $(dialogElement).modal({
            backdrop: 'static',
            keyboard: false
        }, 'show');

         $(dialogElement).on('click', '.spw-close', function(){
            $(dialogElement).remove();
            $('.modal-backdrop').remove();
            // $(dialogElement).element.remove();
            if(option.onClose) {
              option.onClose();
            }
         });
      }

      if(opt.scope) {
        if(!opt.compile) {
          alert("Error: sparrow.showModel()\ncompile option is missing.")
          return
        }
      }

      var option = {
        template: opt.template,
        templateUrl: opt.templateUrl,
        postData: opt.postData,
        onClose: opt.onClose,
        scope: opt.scope,
        compile: opt.compile
      }


      if(option.templateUrl) {
        sparrow.post(option.templateUrl, option.postData, false, function(data){
            showDialog(data);
        }, 'html');
      }
      else {
        showDialog(option.template)
      }
  }

 app.applyEditMode = function(containerId, firstElementId){

    var preDisabledInputs = $(containerId +' input[default-disabled="true"],select[default-disabled="true"]')
    var inputs = $(containerId +' :input').not(preDisabledInputs);
    var preDisabledLabels = $(containerId + ' label[default-disabled="true"]');
    var preDisabledMsIds = '';
    $.each(preDisabledInputs,function(){
      if($(this).parent().hasClass('ms-sel-ctn')){
        preDisabledMsIds += '#'+this.offsetParent.id+',';
      }
    })
    preDisabledMsIds = preDisabledMsIds.slice(0,-1);
    // inputs.attr('disabled', false);
    inputs.prop("readonly",false)
    $(containerId+ ' label').not(preDisabledLabels).removeClass('read-only-labels');
    inputs.removeClass('read-only-mode');
    $(containerId +' .input-group-addon .glyphicon-calendar').show();
    $(containerId+ ' .input-group-addon').removeClass('read-only-mode');
    $(containerId+ ' .ms-ctn').not(preDisabledMsIds).removeClass('read-only-mode');
    $(containerId + ' .has-error .form-control').css('cssText', 'border-bottom-color:#f7f7f7');
    $('.datePicker').css({'pointer-events':''});
    $('.dateCalendarView').css({'pointer-events':'','opacity': ''});
    var magicSuggests = $(containerId+' .ms-ctn').not(preDisabledMsIds);
    magicSuggests.each(function(i){
      var ms = $("#"+this.id).magicSuggest();
      ms.enable();
      $.each(inputs,function(){
            if(this.type == 'checkbox'){
              $(this).attr('disabled',false);
            }
        });
    })
    $(containerId + ' .ms-close-btn').show();
    $(containerId + ' .ms-trigger').filter(function(){
          return $(this).parent().is(":not("+preDisabledMsIds+")");
    }).show();
    $("button[edit-mode='false']").hide();
    $("button[edit-mode='true']").show();
    $('#btnClose').text('Cancel');
    //Focus first element of the page
    app.setControlFocus(firstElementId);
  }

  app.applyReadOnlyMode = function(containerId) {

    var preDisabledInputs = $(containerId +' input:disabled,input[readonly="readonly"],select:disabled,select[readonly="readonly"]');
    var inputs = $(containerId +' :input').not(containerId +' :input[disable-false]');
    var preDisabledInputIds = [];
    $.each(preDisabledInputs , function(){
      preDisabledInputIds.push(this.id) ;
    })
    var preDisabledLabels = $(containerId +' label[for="'+preDisabledInputIds.join('"],[for="') +'"]');
    preDisabledLabels.attr('default-disabled', true);
    preDisabledInputs.attr('default-disabled', true);
    $(containerId+ ' label').addClass('read-only-labels');
    inputs.addClass('read-only-mode');
    $(containerId +' .input-group-addon .glyphicon-calendar').hide();
    $("button[edit-mode='false']").show();
    $("button[edit-mode='true']").hide();
    $('.datePicker').css({'pointer-events':'none'});
    $('.dateCalendarView').css({'pointer-events':'none','opacity': '0.0'});
    setTimeout(function(){
      // let all the elements create in DOM
      var magicSuggests = $(containerId+' .ms-ctn');
      magicSuggests.each(function(){
        var ms = $("#"+this.id).magicSuggest();
        $("#"+this.id).addClass('read-only-mode');
        ms.disable();
        $.each(inputs,function(){
            if(this.type == 'checkbox'){
              $(this).attr('disabled',true);
            }
        });
      });

      // inputs.not(preDisabledInputs).attr('disabled',true);
      inputs.not(preDisabledInputs).prop("readonly",true);
      $(containerId+ ' .input-group-addon').addClass('read-only-mode');
      $(containerId + ' .ms-ctn-disabled .ms-trigger').hide();
      $(containerId + ' .ms-close-btn').hide();
    }, 0);

    // to highlight edit button
    $('#app_container').off('click','.read-only-mode , .read-only-labels')
    $('#app_container').on('click','.read-only-mode , .read-only-labels',function(){
      $('#idEditBtn').addClass('highlight-button');
        setTimeout(function(){
            $('#idEditBtn').removeClass('highlight-button');
        },1000);
    });
  }

  app.setControlFocus = function(firstElementId) {

    setTimeout(function(){
      if (!($(firstElementId).hasClass('ms-ctn') || $(firstElementId).parent().hasClass('input-group'))){
        // var ms = $(firstElementId).magicSuggest();
        //   ms.input.focus();
        $(firstElementId).focus();
        var value = $(firstElementId).val();
        $(firstElementId).val('').val(value);
      }
    },500);
  }

  app.pushLocationHistory = function(originalPath,tabUrl){
    var locationHistory = JSON.parse(sparrow.getStorage(sparrow.global.keys.LOCATION_HISTORY)) || []
    locationHistory.push({OrginalPath: originalPath, Location: tabUrl});
    sparrow.setStorage(sparrow.global.keys.LOCATION_HISTORY, JSON.stringify(locationHistory))
  }

  app.setImagePreview =  function(input, imgId) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
          $('#'+imgId+'').attr('src', e.target.result)
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  app.removeInvaidUTF8Char = function(input) {
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
    return output;
  }

  app.getEntityIframeURL = function(appName, modelName, entityId,related_to, type){
   var  url = ''
    if(appName == 'sales'){
        if(modelName == 'order'){
            url = "/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId+"/"+0
        }
    }
    else if(appName == 'maintenances'){
        if(modelName == 'jobentry'){
          url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
        if(modelName == 'job'){
          url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
    }
    else if(appName == 'financial'){
        if(modelName == 'invoice'){
          url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
    }
    else if(appName == 'products'){
        if(modelName == 'product'){
            url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
    }
    else if(appName == 'campaign'){
        if(modelName =='deal'){
            url="/b/iframe_index/#/partners/"+modelName+"/"+entityId
        }
      }
    else if(appName=='partners'){
        if(modelName=='contact'){
            url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
          }
          if(modelName=='partner'){
            url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+type+"/"+entityId+"/"
          }
        }
    else if(appName=='purchasing'){
        if(modelName=='purchaseorder'){
             url="/b/iframe_index/#/"+appName+"/"+"order/"+entityId+"/"+0
        }
        if(modelName =='purchaserequisition'){
           url="/b/iframe_index/#/"+appName+"/"+"purchase_requisition/"+entityId
        }
        if(modelName=='order'){
             url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId+"/"+0
        }
        if(modelName=='purchase_plan'){
           url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+"order/"+entityId
        }
    }
    else if(appName=='inventory'){
        if(modelName=='plan_estimate'){
            url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
    }
    else if(appName=='production'){
        if(modelName=='mfg_order'){
            url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
        if(modelName == 'bom'){
          url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
    }
    else if(appName=='logistics'){
        if(modelName=='transferorder'){
          url="/b/iframe_index/#/"+appName+"/"+type+"/"+entityId
        }
        if(modelName=='shipment'){
          url="/b/iframe_index/#/"+appName+"/"+modelName+"/"+entityId
        }
    }
  return url;
}
  return app;
};

var sparrow = initSparrow();