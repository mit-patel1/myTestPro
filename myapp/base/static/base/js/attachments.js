(function() {

angular.module('angular-attachments', []).

    directive('angAttachments', function (ModalService) {
        return {
            restrict: 'AEC',
            scope: {
                appName: '@',
                modelName: '@',
                entityId: '@',
                countId: '@',
                files: '@',
                file_types : '@'
            },
            replace: true,
            controller: function($scope,Upload,$route) {
              $scope.showWorkcenter = false;
              $scope.currentIndex = 0;

              if($scope.entityId === "") {
                $scope.comments = [];
                return;
              }
              if($scope.entityId != 0){  
                sparrow.post("/attachment/get_attachments/", { object_id : $scope.entityId, app: $scope.appName, model : $scope.modelName }, false, function(data){ 
                    $scope.$apply(function(){
                      $scope.file_types = data.file_types;
                      $scope.updateCount(data.count);
                      $scope.attachments = data.data;
                      for(var i=0;i<$scope.attachments.length;i++){
                        $scope.attachments[i].isSelected = false;
                        $scope.attachments[i].date = data.data[i].date;
                        $scope.ngcolor = sparrow.global.get(sparrow.global.keys.ROW_COLOR);
                      }
                      if ($scope.attachments.length >= 1){
                        $scope.propertyDetails($scope.attachments[0].name, $scope.attachments[0].title, $scope.attachments[0].subject, $scope.attachments[0].description, $scope.attachments[0].id, $scope.attachments, 0, $scope.attachments[0].is_public, $scope.attachments[0].uid);
                        if ($scope.appName == 'production' && $scope.modelName == 'mfg_order_attachment') {
                          var workCenter = $('#attach_id_workcenter').magicSuggest();
                            if ($scope.attachments[0].workcenter_id && $scope.attachments[0].workcenter_name) {
                              workCenter.setSelection([{'id' : $scope.attachments[0].workcenter_id, 'name': $scope.attachments[0].workcenter_name}])
                            }else{
                              workCenter.clear();
                            }
                        }
                        $scope.attachment_data = $scope.attachments[0]
                      }
                     });
                });

              }

              $scope.closeDailouge = function(event){
                event.preventDefault();
                $('#onAttachmentDailougeModel').attr('class','modal fade');
                $('#onAttachmentDailougeModel').hide();
                $route.reload(); 
              };

              $scope.uploadDailouge = function(files){
                $scope.files = [];
                for(var i=0; i<files.length; i++){                    
                    var fileName = sparrow.removeInvaidUTF8Char(files[i]['name']);
                    $scope.files.push(new File([files[i]], fileName, { type: files[i].type }));
                }
                $scope.onAttachmentDailougeTitle = 'Upload file(s)';
                $('#onAttachmentDailougeModel').show();  
                $('#onAttachmentDailougeModel').attr('class','modal fade in');
              };

              $scope.upload = function(event) {
                  event.preventDefault();
                  var files = $scope.files;
                  var fileType_id = $('#id_file_type').find(":selected").val();
                  var makePublic = $('#is_make_public').is(":checked");
                  if(files.length > 5){
                    sparrow.showMessage("appMsg", sparrow.MsgType.Error, 'You can upload maximum 5 documents at a time.', 10);
                    return false;
                  }
                  if (files && files.length) {
                    for (var i = 0; i < files.length; i++) {
                      if(files[i].size > 20000000){
                        sparrow.showMessage("appMsg", sparrow.MsgType.Error, 'File size of more than 20MB is not allowed.', 10);
                          return false;
                      }
                      $('#loading-image').show();
                      Upload.upload({
                        url: '/attachment/upload_attachment/0/',
                        data: {file: files[i],object_id : $scope.entityId, app: $scope.appName, model : $scope.modelName, file_type:fileType_id, makePublic:makePublic  }
                      }).then(function (resp) {
                          if(resp.data.code == 1){
                            var attachment = resp.data.data[0];
                            attachment.date = attachment.date;
                            $('#onAttachmentDailougeModel').hide();
                            $('#loading-image').hide();
                            $scope.attachments.push(attachment);
                            $scope.propertyDetails($scope.attachments[0].name, $scope.attachments[0].title, $scope.attachments[0].subject, $scope.attachments[0].description, $scope.attachments[0].id, $scope.attachments, 0, $scope.attachments[0].is_public, $scope.attachments[0].uid);
                            if ($scope.appName == 'production' && $scope.modelName == 'mfg_order_attachment') {
                              var workCenter = $('#attach_id_workcenter').magicSuggest();
                              if ($scope.attachments[0].workcenter_id && $scope.attachments[0].workcenter_name) {
                                workCenter.setSelection([{'id' : $scope.attachments[0].workcenter_id, 'name': $scope.attachments[0].workcenter_name}])
                              }else{
                                workCenter.clear();
                              }
                            }
                            $scope.ngcolor = sparrow.global.get(sparrow.global.keys.ROW_COLOR);
                            $scope.attachments[0].isSelected = true;
                            $scope.attachment_data = $scope.attachments[0]
                            $scope.updateCount($scope.attachments.length);
                          }
                          else{
                            sparrow.showMessage("appMsg", sparrow.MsgType.Error, resp.data.msg, 10);
                          }     
                      },function (resp){
                          $('#loading-image').hide();
                          sparrow.showMessage("appMsg", sparrow.MsgType.Error, resp.status, 10);
                      });
                    }  
                  }
              };
            },
            link: function ($scope, elem, attrs,Upload) {
                // $scope.delete = function(attachmentId) { 
                //   var id = attachmentId;
                //   sparrow.post("/attachment/del_attachment/", {id:id, app: $scope.appName, model : $scope.modelName }, false, function(data) {
                //      for(var i = $scope.attachments.length - 1; i >= 0; i--){
                //         if($scope.attachments[i].id == id){
                //           $scope.attachments.splice(i, 1);
                //           break;
                //         }
                //       }  

                //       if ($scope.attachments.length >= 1){
                //         var index = $scope.currentIndex-1
                //         $scope.propertyDetails($scope.attachments[0].name, $scope.attachments[0].title, $scope.attachments[0].subject, $scope.attachments[0].description, $scope.attachments[0].id, $scope.attachments, 0, $scope.attachments[0].is_public, $scope.attachments[0].uid);
                //         $scope.attachments[0].isSelected = false;  
                //         if (index == -1){
                //           $scope.attachments[0].isSelected = true;
                //         }
                //         else{
                //           $scope.propertyDetails($scope.attachments[index].name, $scope.attachments[index].title, $scope.attachments[index].subject, $scope.attachments[index].description, $scope.attachments[index].id, $scope.attachments, index, $scope.attachments[index].is_public, $scope.attachments[index].uid);
                //           $scope.attachments[index].isSelected = true;
                //         }
                //       }

                //       if($scope.attachments.length == 0){
                //         $scope.IsVisible = false;
                //       }
                //       var index = $scope.currentIndex
                //       $scope.attachment_data = $scope.attachments[index]                  
                //       $scope.updateCount($scope.attachments.length);
                //       $scope.$digest();
                //   }); 
                // };
                
                permissions = true
                $scope.delete = function (attachmentId) {
                  var id = attachmentId;
                  if (permissions == true) {
                    sparrow.showConfirmDialog(
                      ModalService,
                      "Are you sure you want to delete record?",
                      "Delete record",
                      function (confirmAction) {
                        if (confirmAction) {
                          sparrow.post(
                            "/attachment/del_attachment/",
                            { id: id, app: $scope.appName, model: $scope.modelName },
                            false,
                            function (data) {
                              for (
                                var i = $scope.attachments.length - 1;
                                i >= 0;
                                i--
                              ) {
                                if ($scope.attachments[i].id == id) {
                                  $scope.attachments.splice(i, 1);
                                  break;
                                }
                              }
                              $scope.updateCount($scope.attachments.length);
                              $scope.$digest();
                            }
                          );
                        }
                      }
                    );
                  } else {
                    sparrow.showMessage(
                      "appMsg",
                      sparrow.MsgType.Error,
                      "You do not have permission to perform this action",
                      5
                    );
                  }
                };

                $scope.updateCount = function(count) {
                    if($("#"+$scope.countId) != undefined) {
                        $("#"+$scope.countId).hide();
                        if(count > 0) {
                            $("#"+$scope.countId).text("(" + count + ")");
                            $("#"+$scope.countId).show();
                        } 
                    }
                }

                if ($scope.appName == 'production' && $scope.modelName == 'mfg_order_attachment') {
                    $scope.showWorkcenter = true;
                    setTimeout(function(){
                      setAutoLookup('attach_id_workcenter','/b/lookups/workcenter/', '',false);
                      var workCenter = $('#attach_id_workcenter').magicSuggest();
                      $(workCenter).on('selectionchange', function(e,m){
                            var selection = workCenter.getSelection()[0];
                            if(selection){
                              $scope.propertySave('workcenter_id',selection.id);
                            }else{
                              $scope.propertySave('workcenter_id',"");
                            }
                      });
                    },0);
                }
                $scope.IsVisible = false;
                $scope.attachment_name = '';
                $scope.attachment_id = 0;



                $scope.propertyDetails = function (attachment_name, attachment_title, attachment_subject, attachment_description, attachment_id, attachment, index, attachment_is_public, attachment_uid) {
                    $scope.currentIndex = index;
                    for(var i=0; i<$scope.attachments.length;i++){
                      if (index == i) {
                        if ($scope.attachments[i].isSelected) {
                          $scope.attachments[i].isSelected = false;
                        }else{
                          $scope.attachments[i].isSelected = true;
                        }
                      }else{
                        $scope.attachments[i].isSelected = false;
                      }
                    }
                    $scope.is_public = attachment_is_public
                    $scope.attachment_data = attachment;
                    $scope.attachment_name = attachment_name;
                    $scope.title = attachment_title;
                    $scope.subject = attachment_subject;
                    $scope.description = attachment_description;
                    $scope.attachment_id = attachment_id;
                    $scope.attachment_uid = attachment_uid;
                    $scope.IsVisible = true;
                    if ($scope.appName == 'production' && $scope.modelName == 'mfg_order_attachment') {
                      var workCenter = $('#attach_id_workcenter').magicSuggest();
                      if (attachment.workcenter_id && attachment.workcenter_name) {
                        workCenter.setSelection([{'id' : attachment.workcenter_id, 'name': attachment.workcenter_name}])
                      }else{
                        workCenter.clear();
                      }
                    }
                }

                $scope.isImage = function(extension){
                    if (extension == "bmp" || extension == "gif" || extension == "png" || extension == "ico" || extension == "jpg" || extension == "jpeg"){
                      return true;
                    }
                    else{
                      return false;
                    }
                }

                $scope.fileSize = function(filesize) {
                  var intFileSize= parseInt(filesize);
                   if(intFileSize > 1) {
                      return true;
                  } else {
                      return false;
                  }
                }
                 
                $scope.getPreviewImage = function(fileName) {
                  var isImage = false;
                  var extension = $scope.getFileExtension(fileName);
                  var previewImageUrl = "";
                  isImage = $scope.isImage($scope.getFileExtension(fileName));
                  if (isImage) {
                      $('image-attachment').css('padding-bottom','0px !important');
                      var msgAttachIndex = fileName.lastIndexOf('/')+1;
                      previewImageUrl = fileName.slice(0, msgAttachIndex) + "t-" + fileName.slice(msgAttachIndex);
                      previewImageUrl = "/static/base/images/file-icons/image.svg"
                      return previewImageUrl;
                  }
                  else {
                      switch (extension) {
                          case "doc":
                              previewImageUrl = "/static/base/images/file-icons/word.svg"
                              return  previewImageUrl;
                          case "docx":
                              previewImageUrl = "/static/base/images/file-icons/word.svg"
                              return previewImageUrl;

                          case "pdf":
                              previewImageUrl = "/static/base/images/file-icons/pdf.svg"
                              return  previewImageUrl;
                          case "ppt":
                              previewImageUrl = "/static/base/images/file-icons/powerpoint.svg"
                              return  previewImageUrl;
                          case "pptx":
                              previewImageUrl = "/static/base/images/file-icons/powerpoint.svg"
                              return  previewImageUrl;
                          case "xlsx":
                              previewImageUrl = "/static/base/images/file-icons/excel.svg"
                              return  previewImageUrl;
                          case "xls":
                              previewImageUrl = "/static/base/images/file-icons/excel.svg"
                              return  previewImageUrl;
                          case "csv":
                              previewImageUrl = "/static/base/images/file-icons/csv.svg"
                              return previewImageUrl;
                          case "xml":
                              previewImageUrl = "/static/base/images/file-icons/xml.svg"
                              return  previewImageUrl;
                          case "txt":
                              previewImageUrl = "/static/base/images/file-icons/txt.svg"
                              return  previewImageUrl;
                          case "zip":
                              previewImageUrl = "/static/base/images/file-icons/zip.svg"
                              return  previewImageUrl;
                          case "rar":
                              previewImageUrl = "/static/base/images/file-icons/rar.svg"
                              return previewImageUrl;
                          default:
                              previewImageUrl = "/static/base/images/file-icons/file.svg"
                              return previewImageUrl;
                      }
                  }
                  return  previewImageUrl;
                };

                $scope.getFileExtension = function(fileName){
                  var extensionIndex = fileName.lastIndexOf('.')+1;
                  var extension = parseInt(extensionIndex) > 0 ? fileName.substr(extensionIndex).toLowerCase() : "";
                  return extension;
                };

                $scope.propertySave = function (field_name,value) {
                  var value= value
                  var filedName = field_name
                  sparrow.post("/attachment/attachment_properties/",{'field_name': field_name, value:value, attachment_id:$scope.attachment_id, app: $scope.appName, model : $scope.modelName , object_id : $scope.entityId} , false, function(data){ 
                    for(var i=0;i<data.data.length;i++){
                        data.data[i].date = data.data[i].date;
                        if (i == $scope.currentIndex) {
                          data.data[i].isSelected = true;
                          $scope.ngcolor = sparrow.global.get(sparrow.global.keys.ROW_COLOR)
                        }
                    }
                    $scope.attachments = data.data;
                    $scope.$digest();
                  }, "json", "appMsg", undefined, undefined, undefined, {'hideLoading': true});
                };

                // $scope.getReadableDateRight = function(createdOn){  
                //    $scope.readableDateRight = '';
                //     var readableDate = '';
                //     var year = createdOn.split('/')[2];
                //     if(moment(new Date().getFullYear()) == year){
                //       readableDate = moment.tz(createdOn).utc().format("MMM D");
                //     }
                //     else{
                //         readableDate = moment.tz(createdOn).utc().format("MMM D");    
                //     }
                //     $scope.readableDateRight = readableDate;
                //     return $scope.readableDateRight;
                // };

                $scope.toggleAccess = function(attachment_data){ 
                  sparrow.post("/attachment/attachment_change_access/", {id : attachment_data.id, app: $scope.appName, model : $scope.modelName}, false, function(data) {
                    if(data.code == 0){
                      sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);                      
                      return
                    }
                    attachment_data.is_public = data.access;                    
                    $scope.$digest();
                  });                    
                }

                $scope.copyLink = function(uid,app,model){
                  sparrow.showMessage("appMsg", sparrow.MsgType.Success, 'URL copied to clipboard.', 10);
                  linkText = '/attachment/dwn_attachment/?uid='+uid+'&a='+app+'&m='+model;
                  url = document.URL.split('/');
                  var finalLink = window.location.protocol+url[2]+linkText;
                  CopyToClipboard(finalLink);
                }
            },
            templateUrl: function(element, attr) {
                return attr.templateUrl || 'angular-attachments.html';
            },
        }
    });
    
})();
 
// angular.module('angular-attachments').run(['$templateCache', function($templateCache) {
//   $('#descriptionDiv').hide();
//     'use strict';
//     $templateCache.put('angular-attachments.html',
     
//       '<div class = "col-sm-12" style="min-height:100px;">\
//           <style>\
//             .drop-box {\
//               background: #F8F8F8;\
//               border: 5px dashed #DDD;\
//               width: auto;\
//               text-align: center;\
//               padding: 40px 10px;\
//               --margin-left: 10px;\
//               font-size: 15px;\
//               height: 100px;\
//               cursor: pointer;\
//               color: #1174da;\
//             }\
//             .drop-box.dragover {\
//               border: 5px dashed blue;\
//             }\
//             .attachmentShow:hover{\
//               background:#f2f2f2\
//             }\
//             UL LI {\
//              list-style-type: none;\
//             }\
//             span.file-size {\
//              color: #6d6c6c ;\
//              margin-left: 10px;\
//              font-size: 13px;\
//             }\
//             .active-attachment{\
//                background-color: #ffffcc;\
//             }\
//             .attachmentDetails{\
//               border-right:1px solid #dddddd;\
//             }\
//             .attachmentDetail{\
//               border-bottom:1px solid #dddddd;padding:8px;padding-right:0px;cursor:pointer;\
//             }\
//             .attachmentIcons{\
//               height:30px;\
//             }\
//             .attachmentLockUnlock{\
//               display:inline-block;width:60px;float:right;margin-top:7px;margin-right:8px;\
//             }\
//             .attachmentUser{\
//               float:right;padding-left:5px;padding-top:1.5%;\
//             }\
//             .attachmentUsers{\
//               margin-top:3px;float:right;text-align:right\
//             }\
//             .attachmentUserImage{\
//               border-radius:50%;\
//             }\
//             .attachmentTitle{\
//               \
//             }\
//             .attachmentDate{\
//               color:#5f6368;margin-top:1.7%;padding-right:5px;\
//             }\
//             .attachmentProperty{\
//               border-left:1px solid #bbbbbb;\
//             }\
//             .attachmentPropertyfile{\
//               font-size:20px;\
//             }\
//             .attachmentPropertyImage{\
//               height:30px;\
//             }\
//             .attachmentproperties{\
//               padding-top:5px;\
//             }\
//             .attachmentPropertyTitle{\
//               padding-top:7px;\
//             }\
//             .attachmentPropertyTitleTxt{\
//               \
//             }\
//             .attachmentPropertyBorder{\
//               border-bottom:1px solid #dddddd;\
//             }\
//            .att-lock {font-size: 15px;vertical-align: middle;margin-left: 8px;cursor:pointer;}\
//         </style>\
//         <div class="form-group"> \
//             <div ngf-drop="uploadDailouge($files)" ngf-select="uploadDailouge($files)" class="drop-box"\
//               ngf-drag-over-class="dragover" ngf-multiple="true">Click here to select file or Drop file here</div>  \
//             <div ngf-no-file-drop>File Drag/Drop is not supported for this browser</div>\
//             <div>\
//         </div>\
//         <table class="col-sm-12" style="margin-top:15px">\
//          <td valign="top" class="col-sm-7 attachmentDetails" >\
//             <div class="col-sm-12 attachmentDetail" ng-repeat="attachment in attachments track by $index" ng-style="attachment.isSelected && {\'background-color\':ngcolor}"\
//             ng-click="propertyDetails(attachment.name, attachment.title, attachment.subject, attachment.description, attachment.id, attachment, $index, attachment.is_public, attachment.uid)"  >\
//                   <div class="col-sm-7">\
//                     <div>\
//                       <img class="attachmentIcons" ng-src="{[{getPreviewImage(attachment.name)}]}" class="image-attachment" ng-class="{\'no-image\':!isImage(getFileExtension(attachment.name)),\'image-file-background\':isImage(getFileExtension(attachment.name))}">\
//                       <a id="child" ng-click="childClick();$event.stopPropagation();"  {{appName == "sales" ? href="/attachment/dwn_attachment/?uid={{attachment.uid}}&a={{appName}}&m={{modelName}}&aid={{attachment_id}}" : href="/attachment/dwn_attachment/?uid={{attachment.uid}}&a={{appName}}&m={{modelName}}&aid={{attachment_id}}"}} target="_blank" >{{attachment.name}}</a>&nbsp<span style="color:#5f6368" ng-if="fileSize(attachment.size)" >({{attachment.size}})</span><span ng-if="attachment.title" style="color:#5f6368"> - </span><span style="color:#5f6368">{{attachment.title}}</span><span style="margin-left:10px;font-color:#656565" ng-if="attachment.is_public" class="icon-users"></span>\
//                     </div>\
//                   </div>\
//                   <div class="col-sm-5 attachmentUsers">\
//                     <span  class="attachmentDate">{{attachment.date}}</span>\
//                     <img class="attachmentUserImage" id="taskUserImg" src="{{attachment.img_src}}" title="{{attachment.user}}"  width="25" height="25"  >\
//                   </div>\
//                   <div>\
//                   </div>\
//             </div>\
//          </td>\
//          <td valign="top" class="col-sm-5 rightAttachment">\
//           <div class="attachmentProperty"  ng-show = "IsVisible">  \
//               <div class="col-sm-12" style="margin-top:8px;">\
//                 <div class="col-sm-1">\
//                 </div>\
//                 <div class="col-sm-7">\
//                     <span class="attachmentPropertyfile" ><img class="attachmentPropertyImage" ng-src="{[{getPreviewImage(attachment_name)}]}" class="image-attachment" ng-class="{\'no-image\':!isImage(getFileExtension(attachment_name)), \'image-file-background\':isImage(getFileExtension(attachment_name))}"><b style="margin-left:10px;">{[{attachment_name}]}</b></span><span style="margin-left:10px;font-color:#656565" ng-if="attachment_data.is_public" class="icon-users"></span>\
//                 </div>\
//                 <div class="col-sm-4" >\
//                   <i  style="float:right;margin-right:3px;" class="icon-trash list-btn fa fa-trash-o fa-bold" ng-click="delete(attachment_id);$event.stopPropagation();" title="Delete document" ref="{{attachment_uid}}" ></i><a style="float:right;margin-top:6px;"  ng-click="childClick();$event.stopPropagation();" {{ appName="sales" ? href="/attachment/dwn_attachment/?uid={{attachment_uid}}&a={{appName}}&m={{modelName}}&aid={{attachment_id}}" : href="/attachment/dwn_attachment/?uid={{attachment_uid}}&a={{appName}}&m={{modelName}}"}}  title="Download document" target="_blank"><i class="icon-download-2" style="font-weight:bold;color:black;margin-right:9px;"></i></a>\
//                    <div class="attachmentLockUnlock">\
//                     <i style="float:right;margin-right:5px"  ng-if="attachment_data.is_public" ng-click="toggleAccess(attachment_data)" title="Revoke public" class="icon-unlocked fa fa-unlock att-lock " />\
//                     <i  style="color:red;;float:right;margin-right:5px" ng-if="!attachment_data.is_public" ng-click="toggleAccess(attachment_data)" title="Make document public"  class="icon-lock fa fa-lock att-lock " /></a>\
//                     <i  style="padding-left:2px;" ng-if="attachment_data.is_public" ng-click="copyLink(attachment_uid,appName,modelName)" title="Copy public URL" class="icon-file-copy fa fa-copy att-lock " />\
//                   </div>\
//                 </div>\
//               </div>\
//               <div class="col-sm-12 attachmentproperties">\
//                 <div class="col-sm-1">\
//                 </div>\
//                 <div class="col-sm-3 attachmentPropertyTitle">\
//                   <label>Title</lable>\
//                 </div>\
//                 <div class="col-sm-8 attachmentPropertyTitleTxt" >\
//                   <input type="text" ng-blur="propertySave(\'title\',title);" ng-model="title" class="form-control"  id="id_attachment_title" name="title" placeholder="Title"   >\
//                 </div>\
//               </div>\
//               <div class="col-sm-12" >\
//                 <div class="col-sm-1" >\
//                 </div>\
//                 <div class="col-sm-3" style="padding-top:5px;"> \
//                   <label>Subject</lable>\
//                 </div>\
//                 <div class="col-sm-8">\
//                   <input type="text" class="form-control" ng-blur="propertySave(\'subject\',subject);" ng-model="subject"  id="id_subject" name="subject" placeholder="Subject" ><br>\
//                 </div>\
//               </div>\
//               <div class="col-sm-12"  >\
//                 <div class="col-sm-1">\
//                 </div>\
//                 <div class="col-sm-3">\
//                   <label>Description</lable>\
//                 </div>\
//                 <div class="col-sm-8" >\
//                   <textarea id="id_description"  ng-blur="propertySave(\'description\',description);" ng-model="description"  class="form-control"  name="description" placeholder="Description" ></textarea>\
//                 </div>\
//               </div>\
//               <div class="col-sm-12" style="margin-top:3%">\
//                 <div class="col-sm-1" >\
//                 </div>\
//                 <div ng-if="showWorkcenter" class="col-sm-3">\
//                   <label>Workcenter</lable><br><br>\
//                 </div>\
//                 <div ng-if="showWorkcenter" class="col-sm-8" >\
//                   <input type="text" class="form-control"  id="attach_id_workcenter" name="workcenter" ng-disabled="false"><br><br>\
//                 </div>\
//               </div>\
//         </div>\
//          </td>\
//         </table>\
//         <div ng-style="attachments.length === 0 && {\'display\':\'block\',\'margin-left\': \'10px\',\'margin-top\': \'10px\'}  || attachments.length > 0 && {\'display\':\'none\'}">\
//           No documents available\
//         </div>\
//       </div>\
//       <div id="onAttachmentDailougeModel" class="modal fade" tabindex="-1" role="dialog">\
//         <div class="modal-dialog modal-lg" role="document" style="width:34%">\
//             <div class="modal-content">\
//                 <div class="modal-header">\
//                     <button type="button" class="close" data-dismiss="modal" aria-label="Close" ng-click="closeDailouge($event);">\
//                         <span aria-hidden="true">&times;</span>\
//                     </button>\
//                     <h4 class="modal-title" id="onAttachmentDailouge" ng-bind="onAttachmentDailougeTitle">Uploaded file(s)</h4>\
//                 </div>\
//                 <div class="modal-body">\
//                     <div class="form-group">\
//                       <div id ="file_info" class="control-label col-sm-12" style="margin-left: -39px;">\
//                         <ul style="font-size:14px;">\
//                           <li ng-repeat="file in files" style="padding-top:10px"><i class="icon-file-upload"></i><span style="margin-left:10px;">{{file.name}}</span> <span class="file-size">Size: {{file.size/1024|number : 2}} KB</span></li>\
//                         </ul>\
//                       </div>\
//                     </div>   \
//                 </div>\
//                 <div class="modal-footer">\
//                     <button class="btn" data-dismiss="modal" aria-hidden="true" ng-click="closeDailouge($event);">Close</button>\
//                     <button class="btn btn-primary" id="btnUpload" ng-click="upload($event);" ng-disabled="btnUploadDisabled">Upload</button>\
//                 </div>\
//             </div>\
//         </div>'
//   );
  
//   }]);


angular.module("angular-attachments").run([
  "$templateCache",
  function ($templateCache) {
    "use strict";
    $templateCache.put(
      "angular-attachments.html",
      '<div class = "col-sm-12" style="min-height:100px;">\
          <style>\
            .drop-box {\
              background: #F8F8F8;\
              border: 5px dashed #DDD;\
              width: auto;\
              text-align: center;\
              padding: 40px 10px;\
              margin-left: 10px;\
              font-size: 15px;\
              height: 100px;\
              cursor: pointer;\
              color: #1174da;\
            }\
            .drop-box.dragover {\
              border: 5px dashed blue;\
            }\
            UL LI {\
              list-style-type: none;\
            }\
            #id_file{\
              padding-top:15px;\
              padding-bottom:3px;\
            }\
            span.file-size {\
              color: #6d6c6c ;\
              margin-left: 5px;\
              font-size: 13px;\
            }\
            .att-lock {font-size: 15px;vertical-align: middle;margin-left: 8px;cursor:pointer;}\
            \
        </style>\
          <div class="form-group" style="margin-top: 10px;"> \
            <div ngf-drop="uploadDailouge($files)" id="id_add_attachment" ngf-select="uploadDailouge($files)" class="drop-box"\
              ngf-drag-over-class="dragover" ngf-multiple="false" >Click here to select file or Drop file here</div>  \
            <div ngf-no-file-drop>File Drag/Drop is not supported for this browser</div>\
            <div>\
          </div>\
          <table style="width: 100%;margin-top:15px;" class= "col-sm-12" ng-style="attachments.length === 0 && {\'display\':\'none\'}  || attachments.length > 0 && {\'display\':\'inline-table\'}">\
            <tr role ="row" style="padding: 10px 18px;border-bottom: 1px solid #DDDDDD;height:35px;border-top: 1px solid #DDDDDD;">\
              <th> Name </th>\
              <!--<th> File type </th>-->\
              <th> Size </th>\
              <th> Uploaded By </th>\
              <th> Uploaded On </th>\
              <th></th>\
              <th></th>\
              <th></th>\
            </tr>\
            <tr ng-repeat="attachment in attachments" role="row" style = "border-bottom: 1px solid #DDDDDD;height:45px;"> \
              <td style="padding-left:0px">\
                <a href="/attachment/dwn_attachment/?uid={{attachment.uid}}&a={{appName}}&m={{modelName}}&type={{attachment.file_type}}&object_id={{attachment.object_id}}" target="_blank">{{attachment.name}}</a>\
              </td>\
              <!--<td style="padding-left:0px">{{attachment.file_type}}</td>-->\
              <td style="padding-left:0px">{{attachment.size}}</td>\
              <td style="padding-left:0px">{{attachment.user}}</td>\
              <td style="padding-left:0px">{{attachment.date}}</td>\
              <td class="row" ng-if="attachment.file_type == \'PO\'">\
                <a href="/attachment/dwn_attachment/?uid={{attachment.uid}}&a={{appName}}&m={{modelName}}&type={{attachment.file_type}}&object_id={{attachment.object_id}}" target="_blank"><i class="icon-file-download list-btn fa fa-arrow-circle-down" style="margin-left: 30px;"></i></a>\
                <i class="icon-pencil-1 list-btn" ng-click="edit(attachment.name,attachment.size,attachment.file_type,attachment.file_desc)" ref="{{attachment.uid}}" ng-show ="attachment.po_status == true" style="margin-left: 10px;"></i>\
                <!--<i class="icon-trash list-btn fa fa-trash-o" ng-click="delete(attachment.id)" ref="{{attachment.uid}}"  style="margin-left: 10px;"></i>-->\
              </td>\
              <td class="row" ng-if="attachment.file_type != \'PO\'">\
                <a href="/attachment/dwn_attachment/?uid={{attachment.uid}}&a={{appName}}&m={{modelName}}&type={{attachment.file_type}}&object_id={{attachment.object_id}}" target="_blank"><i class="icon-file-download list-btn fa fa-arrow-circle-down" style="margin-left: 30px;"></i></a>\
                <i class="icon-pencil-1 list-btn" ng-click="edit(attachment.name,attachment.size,attachment.file_type,attachment.file_desc)" ref="{{attachment.uid}}" ng-show="hasType(attachment.file_desc) && attachment.is_scope != false" style="margin-left: 10px;"></i>\
                <!--<i class="icon-trash list-btn fa fa-trash-o" ng-click="delete(attachment.id)" ref="{{attachment.uid}}"  style="margin-left: 10px;"></i>-->\
              </td>\
            <tr>\
          </table> \
        <div ng-style="attachments.length === 0 && {\'display\':\'block\',\'margin-left\': \'10px\',\'margin-top\': \'10px\'}  || attachments.length > 0 && {\'display\':\'none\'}">\
          No files available\
        </div>\
      </div>\
      <div id="onAttachmentDailougeModel" class="modal fade" tabindex="-1" role="dialog" data-ng-show="files.length != 0">\
        <div class="modal-dialog modal-lg" role="document" style="width:35%">\
            <div class="modal-content">\
                <div class="modal-header">\
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" ng-click="closeDailouge($event);">\
                        <span aria-hidden="true">&times;</span>\
                    </button>\
                    <h4 class="modal-title" id="onAttachmentDailouge" ng-bind="onAttachmentDailougeTitle">Uploaded file(s)</h4>\
                </div>\
                <div class="modal-body">\
                    <div class="form-group">\
                      <div id ="file_info" class="control-label col-sm-12" style="margin-left: -39px;">\
                        <ul style="font-size:14px;">\
                          <li ng-repeat="file in files" style="padding-top:10px"><i class="icon-file-upload"></i><span style="margin-left:10px;">{{file.name}}</span> <span class="file-size">Size: {{file.size/1024|number : 2}} KB</span></li>\
                        </ul>\
                      </div>\
                    </div>\
                </div>\
                <div class="modal-footer">\
                    <button class="btn" data-dismiss="modal" aria-hidden="true" ng-click="closeDailouge($event);">Close</button>\
                    <button class="btn btn-primary" id="btnUpload" ng-click="upload($event);" ng-disabled="btnUploadDisabled">Upload</button>\
                </div>\
            </div>\
        </div>'
    );
  },
]);
 
