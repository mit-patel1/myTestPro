(function() {
angular.module('angular-comments', [])
    .filter('trusted', function($sce){
        return function(html){
            return $sce.trustAsHtml(html)
        }
    })
    .directive('angComments', function () {
        return {
            restrict: 'AEC',
            scope: {
                appName: '@',
                modelName: '@',
                entityId: '@', 
                mentionedIn : '@',                              
                comments: '@',
                modelRemarkField: '@',
                countId: '@',
                deleteButton: '@',
                user: '@',
                existUsers : '@',
                cmtButtonText: '@'
            },
            replace: true,
            controller: function($scope, Upload) {
                $scope.existUsers = [];
                $scope.fileMaxCount = 0;
                $scope.files = [];
                $scope.cmtButtonText = 'Add comment';
                if($scope.modelName == 'deal'){
                    $scope.cmtButtonText = 'Add note';
                }
                $scope.cmtButtonDisable = false;
                
                $scope.uploadDailouge = function(files){
                    if(files.length != 0){
                        for(var i=0; i < files.length; i ++){
                            $scope.files.push(files[i]);
                            var currentValue = files[i].name;
                            $scope.fileMaxCount = $scope.fileMaxCount + 1;
                            $('#attachmentList'+$scope.entityId).prepend('<div class="mail-attachment"><span data-attachment-name="attachment'+$scope.fileMaxCount+'"">'+currentValue+'</span><i class="icon-close"></i></div>');
                        }                  
                    }
                    
                };
                
                setTimeout(function(){
                    $('#txtComment'+$scope.entityId).summernote({
                        height: 50, 
                        toolbar: [                        
                            ['style', ['bold', 'italic', 'underline']],
                            ['font', ['color']],  
                        ],
                        callbacks: {
                           onInit: function() {                            
                              $('#txtComment'+$scope.entityId).next().find('.note-toolbar').hide();
                            },
                            onFocus: function() {
                                $('#txtComment'+$scope.entityId).next().find('.note-toolbar').show();
                            },
                            onBlur: function() {
                                $('#txtComment'+$scope.entityId).next().find('.note-popover').css('display', 'none');
                                $scope.existUsers = [];
                            }
                        },
                        hint: {
                        match: /\B@(\w*)$/,                  
                        search: function (keyword, callback) {                    
                            sparrow.post("/base/get_all_user_list/", {keyword:keyword, existUsers: JSON.stringify($scope.existUsers)}, false, function(data){ 
                                callback(data);
                            },'json', 'appMsg', undefined, undefined, undefined, {'hideLoading': true});
                        },
                        content: function (item) {                                                        
                            var userSpan = $(item)[0];
                            var userSpanContent = '<b style="color:#337ab7;">@'+ $(userSpan).text() + '&nbsp;</b><span>&nbsp;</span>';
                            $(userSpan).html(userSpanContent);                            
                            $scope.existUsers.push(parseInt($(item).attr('ref')));                            
                            return $(userSpan)[0];
                        }    
                      }
                    });

                    
                    $('body').on('click', 'div.mail-attachment i',function(){
                        for(var j=0 ; j < $scope.files.length; j++){
                            if($(this).parent().text() == $scope.files[j].name){
                                var index = $scope.files.indexOf($scope.files[j]);
                                $scope.files.splice(index, 1);
                            }
                        }
                        $('[name="'+$(this).parent().find('span').attr('data-attachment-name')+'"]').remove();
                        $(this).parent().remove();
                    });

                }, 0);

                
                if($scope.entityId === "") {
                    $scope.comments = [];
                    return;
                }

                var postData = {
                    app_name: $scope.appName,
                    model_name: $scope.modelName,
                    entity_id : $scope.entityId      
                }
                sparrow.post("/base/get_remarks/", postData, false, function(data){ 
                    $scope.updateCount(data.count);  
                    $scope.comments = data.data;
                    $scope.user = data.user;                    
                    $scope.$digest();
                });

                $scope.saveComment = function() {
                    var remark = $('#txtComment'+$scope.entityId).summernote('code').trim();
                    var stageName = $('#stageName').val();
                    if(remark == ''){
                        return false;
                    }
                    var files = $scope.files;
                    if(files.length > 5){
                        sparrow.showMessage("appMsg", sparrow.MsgType.Error, 'You can upload maximum 5 documents at a time.', 10);
                        return false;
                    }
                    var mentionedUsers = [];
                    var mentionedUsersEles = $($.parseHTML(remark)).find(".usr-ref");                    
                    for (var i=0; i < mentionedUsersEles.length; i++) {
                        mentionedUsers.push($(mentionedUsersEles[i]).attr('ref'));
                    }

                    var postData = {
                        app_name: $scope.appName,
                        model_name: $scope.modelName,
                        entity_id: $scope.entityId,
                        remark: remark,
                        stageName:stageName,
                        model_remark_field: $scope.modelRemarkField,
                        mentioned_in : $scope.mentionedIn,
                        mentionedUsers: mentionedUsers.join([separator = ',']),
                        fileCount: files.length,
                    }

                    if (files && files.length != 0) {
                        for (var i = 0; i < files.length; i++) {
                          if(files[i].size > 5020000){
                            sparrow.showMessage("appMsg", sparrow.MsgType.Error, 'File more than 5MB size is not allowed.', 10);
                              return false;
                          }
                          postData['file'+i] = files[i];
                        }
                    }

                    $scope.cmtButtonText = "Adding..."
                    $scope.cmtButtonDisable = true;

                    Upload.upload({
                        url: '/base/create_remark/',
                        data: postData
                      }).then(function (resp) {
                          $scope.cmtButtonText = "Add comment";
                          if($scope.modelName == 'deal'){
                                $scope.cmtButtonText = 'Add note';
                            }
                          $scope.cmtButtonDisable = false;

                          if(resp.data.code == 1){
                            $('#txtComment'+$scope.entityId).summernote('code', '');
                            $scope.fileMaxCount = 0; 
                            $('.mail-attachment').remove();                   
                            $scope.comments.push(resp.data.data[0]);
                            $scope.updateCount($scope.comments.length);
                            $scope.files = [];
                            $scope.existUsers = [];
                          }
                          else{
                            sparrow.showMessage("appMsg", sparrow.MsgType.Error, resp.data.msg, 10);
                          }     
                      },function (resp){
                          $scope.cmtButtonText = "Add comment";
                          if($scope.modelName == 'deal'){
                                $scope.cmtButtonText = 'Add note';
                            }
                          $scope.cmtButtonDisable = false;

                          $('#loading-image').hide();
                          sparrow.showMessage("appMsg", sparrow.MsgType.Error, resp.status, 10);
                      });
                };

                
            },
            link: function (scope, elem, attrs, Upload) {

                // scope.saveComment = function () {                    
                //     if(scope.entityId === "") {
                //         sparrow.showMessage("appMsg", sparrow.MsgType.Error, "Please create record before adding remark.", 10);
                //         return
                //     }

                //     var remark = $('#txtComment'+scope.entityId).summernote('code');
                //     var mentionedUsers = [];
                //     var mentionedUsersEles = $(remark).find(".usr-ref");
                //     for (var i=0; i < mentionedUsersEles.length; i++) {
                //         mentionedUsers.push($(mentionedUsersEles[i]).attr('ref'));
                //     }

                //     var postData = {
                //         app_name: scope.appName,
                //         model_name: scope.modelName,
                //         entity_id: scope.entityId,
                //         model_remark_field: scope.modelRemarkField,
                //         remark: remark,
                //         mentioned_in : scope.mentionedIn,
                //         mentionedUsers: mentionedUsers.join([separator = ','])
                //     }

                //     sparrow.post("/base/create_remark/", postData, false, function(data){
                //         if(data.code == 0) {
                //             sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                //             return;
                //         }
                //         $('#txtComment'+scope.entityId).summernote('code', '');
                //         scope.fileMaxCount = 0; 
                //         $('.mail-attachment').remove();                   
                //         scope.comments.push(data.data[0]);
                //         scope.updateCount(scope.comments.length);
                //         scope.existUsers = [];
                //         scope.$digest();
                //     });                    
                // };

                scope.deleteComment = function (commentId) {
                    var postData = {
                        app_name: scope.appName,
                        model_name: scope.modelName,
                        entity_id: scope.entityId,
                        model_remark_field: scope.modelRemarkField,
                        remark_id:commentId
                    }
                    sparrow.post("/base/delete_remark/", postData, false, function(){
                        for(var i = scope.comments.length - 1; i >= 0; i--){
                            if(scope.comments[i].id == commentId){
                                scope.comments.splice(i, 1);
                                break;
                            }
                        }
                        scope.updateCount(scope.comments.length);
                        scope.$digest();
                    });                    
                }
                scope.updateCount = function(count) {
                    if($("#"+scope.countId) != undefined) {
                        $("#"+scope.countId).hide();
                        if(count > 0) {
                            $("#"+scope.countId).text("(" + count + ")");
                            $("#"+scope.countId).show();
                        } 
                    }
                }
                
            },
            templateUrl: function(element, attr) {
                return attr.templateUrl || 'angular-comments.html';
            },
        }
    });
})();

angular.module('angular-comments').run(['$templateCache', function($templateCache) {
    'use strict';
    $templateCache.put('angular-comments.html',    
      '<div class="ang-comment">\
      <style>\
        .mail-attachment{\
          width: 20%;\
          padding-top:2px;\
          height: 24px;\
          background: #f5f5f5;\
          margin-bottom: 10px;\
          }\
        .mail-attachment span{\
          vertical-align: sub;\
          display: inline-block;\
          padding-left: 5px;\
          color: #0000ff;\
          }\
        .mail-attachment i{\
          float: right;\
          margin-top: 7px;\
          margin-right: 5px;\
          cursor: pointer;\
        }\
        .cmtButton {\
            width:100px;\
        }\
      </style>\
        <div class="comments-container">\
            <ul id="comments-list" class="comments-list" ng-style="comments.length == 0 && {\'display\':\'none\'}  || comments.length > 0 && {\'display\':\'block\'}">\
                <li ng-repeat="comment in comments">\
                    <div class="comment-main-level">                        \
                        <div class="comment-avatar"><img ng-if="comment.display_img" src="{{comment.display_img}}" alt="{{comment.display_name}}">\
                            </div>\
                        <div class="comment-box">\
                            <div class="comment-head">\
                                <h6 class="comment-name">{{comment.display_name}}</h6>\
                                <span class="time">{{ comment.date }}</span>\
                                <b style="margin-left: 7px;">{{comment.stageName}}</b>\
                                <i ng-if = "user == comment.user_id" ng-click="deleteComment(comment.id);" class="icon-trash" title="Delete remark"></i>\
                            </div>\
                            <div class="comment-content" ng-bind-html="comment.remark | trusted">\
                            </div>\
                            <div>\
                                <div ng-repeat="attachment in comment.attachments" style="margin-top:7px;">\
                                    <span><i class="icon-paper-clip"></i></span>\
                                    <span style="margin-left:5px;">\
                                        <a href="/attachment/dwn_attachment/?uid={[{attachment.uid}]}&a=base&m=remark_attachment" target="_blank">{{attachment.name}}</a>                                        \
                                    </span>\
                                </div>\
                            </div>\
                        </div>\
                    </div>      \
                </li>\
            </ul>            \
        </div>\
        <textarea cols="40" rows="5" class="form-control" id="txtComment{{entityId}}"> </textarea>\
        <div id="attachmentList{{entityId}}"></div>\
        <!-- <div>\
            <div ngf-select="uploadDailouge($files)" ngf-multiple="true" id="cmt-spnattach{{entityId}}">\
                <span style="cursor:pointer;color:#337ab7;">\
                    <i class="icon-paper-clip" style="font-size: 15px;"></i><span style="margin-left:5px;">Attach file</span>\
                </span>    \
            </div>   \
        </div> -->\
        <div style="margin-top: 5px;">\
            <input type="button" class="btn btn-primary cmtButton" ng-click="saveComment();" ng-disabled="cmtButtonDisable" value="{{cmtButtonText}}" />\
        </div>    \
    </div>'
  );
  
  }]);