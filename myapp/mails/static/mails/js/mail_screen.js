 sparrow.config(['$routeProvider', '$controllerProvider', function($routeProvider, $controllerProvider) {

  sparrow.registerCtrl = $controllerProvider.register; 

  var fileMaxCount = 0;

  sparrow.registerCtrl('MailScreenController', function($scope, $route, $element, title, appName, model, attachments, entityId, mailSendURL, toEmails,cc_mails, emailTeplate, skipMailURL, orderType, callback){
        $scope.title = title;
        $scope.appName = appName;
        $scope.model = model;
        $scope.entityId = entityId;
        $scope.attachments = attachments ;
        $scope.mailSendURL = mailSendURL;
        $scope.toEmails = toEmails;
        $scope.cc_mails = cc_mails;
        $scope.emailTeplate = emailTeplate;
        $scope.skipMailURL = skipMailURL;
        $scope.btnText = 'Send quotation'; 

        $scope.$applyAsync(function() {
            for(var i = 0; i < attachments.length; i++){
                if(attachments[i].ext == '.pdf'){
                    var url = attachments[i].url+$scope.entityId+'/';
                    var pdfIcon = '<div class="attachments">\
                        <div class="outer-box attachments-image">\
                        <img src="/static/images/32pdf.png" alt="B1277973.pdf" title="B1277973.pdf" style = "margin-left: 26px;">\
                        <div style="text-align: center;">\
                        <a target="_blank" class="fle-dnload" href="'+url+'">View '+attachments[i].name+'</a></div></div></div>';
                    $('.mail-link-pdf').append(pdfIcon);
                }
                if(attachments[i].ext == '.excel'){
                    var url = attachments[i].url+$scope.entityId+'/';
                    var excelIcon = '<div class="attachments">\
                        <div class="outer-box attachments-image">\
                        <img src="/static/images/32excel.png" alt="B1277973.pdf" title="B1277973.pdf" style = "margin-left: 26px;">\
                        <div style="text-align: center;">\
                        <a target="_blank" class="fle-dnload " href="'+url+'">View Quotation</a></div></div></div>';
                    $('.mail-link-excel').append(excelIcon);
                }
            }
            
            $('.mail-footer').append('<a id="continue_without_mail" class="continue-without-mail" style="float: left;cursor:pointer;font-size:13px;margin-top: 10px;">Continue without mail</a>')
            
            $('.mail-footer').off('click', '.continue-without-mail');            
            $('.mail-footer').on('click', '.continue-without-mail', function() {
                sparrow.post(skipMailURL, {order_id : $scope.entityId}, false, function(data) {
                    if(data.code == 1){
                        $element.modal('hide');      
                        $('.modal-backdrop').remove();                        
                        
                        callback({sentMail: false});
                        // $route.reload();
                    }
                    else{
                        sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                    }
                });    
            })
            
        });

        $scope.cancel = function() {
            $element.modal('hide');       
            $('.modal-backdrop').remove();            
            fileMaxCount = 0;

            if(callback) {
                callback();
            }            
        };

        $scope.send = function() {
            if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+/.test($scope.cc_mails) || $scope.cc_mails == "" || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($scope.cc_mails))
            {
                sparrow.postForm({counter: fileMaxCount, order_id : entityId, toUser:$scope.toEmails ,ccUser:$scope.cc_mails}, $('#frmSendMail'), $scope, function(data) {
                    if(data.code == 1){
                        $element.modal('hide');   
                        $('.modal-backdrop').remove();
                        sparrow.showMessage("appMsg", sparrow.MsgType.Success, data.msg, 10);                    
                        fileMaxCount = 0;                    
                        $route.reload();
                        callback({sentMail: true});
                    }
                    else{
                        sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                    }
                },'appMsg');
            }else{
                sparrow.showMessage("appMsg", sparrow.MsgType.Error,'Please Enter a valid Email Address ', 10);
            }
            
        };
        // $('body').on('change','[name="attachment"]',function(event){
        //     if($('[name="attachment"]').val()!=''){
        //         var currentValue = $('[name="attachment"]')[0].files[0].name;
        //         // var ext = currentValue.split('.').pop();
        //         // var extensionList = ['xls','txt','xlsx','zip','rar','pdf','jpg','jpeg','png',]
        //         // if(ext == '' || extensionList.indexOf() == -1)
        //         fileMaxCount = parseInt(fileMaxCount) + 1;
        //         $('#attachmentList').prepend('<div class="mail-attachment"><span data-attachment-name="attachment'+fileMaxCount+'"">'+currentValue+'</span><i class="icon-close"></i></div>');
        //         $('[name="attachment"]').css('display','none').attr('name','attachment'+fileMaxCount);
        //         $('#fileUploadParent').append('<input class="form-control" name="attachment" type="file">');
        //     }
        // });


        $('body').off('change','[name="attachment"]');
        $('body').on('change','[name="attachment"]', function(event){
            if($('[name="attachment"]').val()!=''){
                var currentValue = $('[name="attachment"]')[0].files[0].name;       
                // var ext = currentValue.split('.').pop();
                // var extensionList = ['xls','txt','xlsx','zip','rar','pdf','jpg','jpeg','png',]
                // if(ext == '' || extensionList.indexOf() == -1)
                fileMaxCount = parseInt(fileMaxCount) + 1;
                $('#attachmentList').prepend('<div class="mail-attachment"><span data-attachment-name="attachment'+fileMaxCount+'"">'+currentValue+'</span><i class="icon-close"></i></div>');
                $('[name="attachment"]').css('display', 'none').attr('name','attachment'+fileMaxCount);
                $('#fileUploadParent').append('<input class="form-control" name="attachment" type="file">');
            }
        });


        $('body').off('click','div.mail-attachment i');
        $('body').on('click', 'div.mail-attachment i',function(){
            $('[name="'+$(this).parent().find('span').attr('data-attachment-name')+'"]').remove();
            $(this).parent().remove();
        });

        if (orderType == 'order'){
            $scope.btnText = 'Send confirmation' 
        }
  });
}]);