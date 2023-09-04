function taskSchedularsInit() {
  var taskSchedulars = {}
  var packages = {};
    sparrow.registerCtrl('taskSchedulersCtrl',function($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, ModalService){        
        var taskSchedularId = 0;
        var is_valid = true ; 
        var task_scheduler_id = 0;
        $scope.hasEmailCheked = false;
        
        var config = {
            pageTitle: "Task scheduler",
            topActionbar: {
               delete :{
                    url: "/base/delete_task_scheduler/",
               },
              extra: [{
                    id:"btnShowLog",
                    function: showLog,
                    multiselect : false
                  },{
                    id:"btnTaskSCheduler",
                    function: addTaskScheduler,
                  },{
                    id:"btnInsertSysScheduler",
                    function : insertSysScheduler,
                  }]
            },
             listing: [{
                paging  : false,
                index : 1,
                url: "/base/task_schedulers_search/",
                crud: true,
                columns: [
                    { name : 'title', title: 'Name', renderWith: function(data, type, full, meta) {
                        return '<a href="" ng-click="editTaskScheduler('+full.id+')" >'+data+'</a>'
                      } 
                    },
                    { name : 'triggers' , title : 'Triggers' ,sort: false},
                    { name : 'last_run' , title : 'Last run time (UTC)' },
                    { name : 'last_run_result' , title : 'Last run result' },
                    { name : 'next_run' , title : 'Next run time (UTC)'},
                    { name : 'is_active' , title : 'Status' , renderWith: function(data, type, full, meta) {
                          if (data){
                            return '<a href="" ng-click="changeStatus('+data+','+full.id+')" >Enable</a>'
                          }
                          return '<a href="" ng-click="changeStatus('+data+','+full.id+')" >Disable</a>'
                      }
                    },
                    { name: 'show_run', title: 'Run', sort: false, renderWith: function(data, type, full, meta) { 
                          var runningStatus = ''
                          var pendingStatus =''
                          if (full.status == 'pending'){
                            var runningStatus = 'cursor:pointer;display:none;';
                            var pendingStatus ='color: #2ECA59; font-size: 18px;cursor:pointer;';
                          }
                          else{
                            var runningStatus = 'cursor:pointer;';
                            var pendingStatus ='display:none;color: #2ECA59; font-size: 18px;cursor:pointer;';
                          }
                          return '<i class="icon-arrow-2-circle-right pending" style="'+pendingStatus+'" id="run_'+full.id+'" ng-click="runScheduler('+full.id+',\''+data+'\')"></i><img style="'+runningStatus+'" class="process" id="process_'+full.id+'"  title="processing" src="/static/base/images/spinner.gif">';    
                      }
                    },
                ]
            }]
        };
        
        $('#has_email').change(function(){
           if($(this).is(":checked")) {
                $scope.hasEmailCheked = true;
           }else {
                $scope.hasEmailCheked = false;
           }
           $scope.$apply(function(){
                $scope.hasEmailCheked
           });
        })

        $scope.changeStatus = function(data,id){
          msg = "Are you sure you want to enable this scheduler?"
          if(data) {
            msg = "Are you sure you want to disable this scheduler?"
          }

          sparrow.showConfirmDialog(ModalService, msg, "Task scheduler  ", function(confirm) {
            if(confirm) {
              postData = {
                  id : id,
                  status : data
              }
              sparrow.post("/base/change_status/",  postData , true, function(data) {
                  $scope.reloadData(1);
                });              
            }
          });
        }
        $scope.runScheduler = function(id,data){
          $('#run_'+id+'').hide();
          $('#process_'+id+'').show();
            sparrow.post("/base/run_scheduler/", {url : data}, false, function(data) {
                if (data.code == 1){
                    sparrow.showMessage("appMsg", sparrow.MsgType.Success, data.msg, 10);
                } else {
                    sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                }
                $('#run_'+id+'').show();
                $('#process_'+id+'').hide();
            });
        }

        function showLog(scope){
            var selectedId = $scope.getSelectedIds(1)[0];
            window.location.hash = "#/auditlog/logs/taskscheduler/"+selectedId
        }

        function insertSysScheduler(rootScope) {
            sparrow.post("/base/insert_system_scheduler/", {}, false, function(data) {
                $route.reload();
            });
        }
      
        $scope.editTaskScheduler = function(id){
            task_scheduler_id = id;
            var postData = {
                'id' : task_scheduler_id,
            }
            sparrow.post("/base/task_scheduler/",  postData , false, function(data) {
                  $('#taskScheduleModel').modal('show');
                  $('#id_modalHeading').text('Task scheduler');
                  hideSchdule();
                  setData(data['task_scheduler'])
            });   
        }
        // new 
        function addTaskScheduler(){
             task_scheduler_id = 0;
             $('#taskScheduleModel').modal('show');
             $('#id_modalHeading').text('Task scheduler');
             $('#id_title').val('');
             $('#url').val('') ;

             $('input[type=checkbox][name=week]').prop('checked',false)
             $('input[type=checkbox][name=days]').prop('checked',false)
             $('input[type=radio][value=once]').prop('checked',true)
             $('input[type=checkbox][name=is_active]').prop('checked',true)
             $('#recur_inf_time').val('');
             $("#infinity_type").val("minute")

             $scope.hasEmailCheked = false;
             $('#notification_email').val('')
             $('#has_email').prop('checked', false)

              $scope.$apply(function(){
                $scope.hasEmailCheked
              });
             
             initView()
        }
        function initView(){
          hideSchdule();
           var date = new Date();
           var utcDate = moment.utc(date)
           var utcTime = utcDate.format('hh:mm')
            $('#id_start_time').val(utcTime);
            $('#id_start_datepicker').datepicker({
                locale: 'en',
                format: 'dd/mm/yyyy',
                useCurrent: false,
            }).datepicker("setDate", utcDate.format('DD/MM/YYYY'));

            $('#id_end_datepicker').datepicker({
                locale: 'en',
                format: 'dd/mm/yyyy',
                useCurrent: false,
            }).datepicker("setStartDate", utcDate.format('DD/MM/YYYY'));

            $("#id_start_datepicker").on("change", function (e) {
                $('#id_end_datepicker').datepicker('setStartDate', e.target.value);
            });

            $("#id_end_datepicker").on("change", function (e) {
                $('#id_start_datepicker').datepicker('setEndDate', e.target.value);
            });
        }
        
        $('input[type=radio][name=recur]').on('change', function() {
            hideSchdule();
            switch($(this).val()) {
                case 'daily':
                    $('#recur_daily').show();
                    $('#recur_end_date').show();
                    break;
                case 'weekly':
                    $('#recur_weekly').show();
                    $('#recur_end_date').show();
                    break;
                case 'monthly':
                    $('#recur_monthly').show();
                    $('#recur_end_date').show();
                    break;
                case 'infinity':
                    $('#recur_infinity').show();
                    break;
             }
        });
        function hideSchdule(){

            $('#recur_daily').hide();
            $('#recur_weekly').hide();
            $('#recur_monthly').hide();
            $('#recur_end_date').hide();
            $('#recur_infinity').hide();
            
        }

        function setData(data) {
            $('#id_title').val(data.title)
            $('#url').val(data.url)
            if(data.notification_email != '' && data.notification_email != null){
                $scope.hasEmailCheked = true
                $('#has_email').prop('checked', true)
            }else {
                $scope.hasEmailCheked = false
                $('#has_email').prop('checked', false)
            }
            $scope.$apply(function(){
                $scope.hasEmailCheked
            });
            $('#notification_email').val(data.notification_email);
            $('input[type=checkbox][name=is_active]').prop('checked',data.is_active);
            schedule_data =  JSON.parse(data.schedule)
            if(schedule_data != ''  && schedule_data != undefined) {
                $("input[name='recur'][value=" + schedule_data.recur_type + "]").prop('checked',true);
                $('#id_start_date').val(schedule_data.start_date);
                $('#id_start_time').val(schedule_data.start_time);
                if(schedule_data.recur_type != 'once') {
                    $('#id_end_date').val(schedule_data.recur_end_date); 
                }
                if(schedule_data.recur_type == "daily") {
                    $('#recur_daily').show();
                    $('#recur_end_date').show();
                    $('#id_daily_day').val(schedule_data.recur_day);
                }
                else if(schedule_data.recur_type == "weekly") {
                    $('#recur_weekly').show();
                    $('#recur_end_date').show();
                    $('#id_weekly_day').val(schedule_data.recur_day);
                    for(var i in schedule_data.recur_week_days) {
                      var day = schedule_data.recur_week_days[i];
                      $("input[name='week'][value=" + day + "]").prop('checked',true);
                    }
                }
                else if(schedule_data.recur_type == "monthly") {
                    $('#recur_monthly').show();
                    $('#recur_end_date').show();
                    for(var i in schedule_data.recur_month_days) {
                        var day = schedule_data.recur_month_days[i];
                       $("input[name='days'][value=" + day + "]").prop('checked',true);
                    }    
                }
                else if(schedule_data.recur_type == "infinity") {
                   $('#recur_infinity').show();
                   $('#infinity_type').val(schedule_data.infinity_type);
                   $('#recur_inf_time').val(schedule_data.recur_inf_time);
                }
            }
        }
        
        function onSubmit() {
            if ($('#id_start_date').val() == '' || $('#id_start_time').val() == ''){
                is_valid = false ;
            }
            scheduleData = {
                start_date: $('#id_start_date').val(),
                start_time: $('#id_start_time').val(),  
            }     
            if($('#id_infinity').is(':checked')) {
                scheduleData.recur_type = 'infinity';
                scheduleData.infinity_type = $('#infinity_type').val();
                scheduleData.recur_inf_time = $('#recur_inf_time').val();
                if ($('#recur_inf_time').val() == '' || parseInt($('#recur_inf_time').val()) <= 0){
                    is_valid = false ;
                }
            }else if($('#id_once').is(':checked')) {
                scheduleData.recur_type = 'once';
            } else { 
                scheduleData.recur_end_date = $('#id_end_date').val();
                start_date = toDate($('#id_start_date').val());
                end_date = toDate($('#id_end_date').val());
                difference = (end_date - start_date) / (1000 * 3600 * 24);
                var favorite = [];

                if($('#id_daily').is(':checked')) {
                    if ( $('#id_daily_day').val() == '' || parseInt($('#id_daily_day').val()) <= 0 ){
                        is_valid = false
                    }
                    scheduleData.recur_type = 'daily';
                    scheduleData.recur_day = $('#id_daily_day').val();
                }
                else if($('#id_weekly').is(':checked')) {
                    $.each($("input[name='week']:checked"), function(){
                        favorite.push($(this).val());
                    });
                    scheduleData.recur_type = 'weekly';
                    scheduleData.recur_day = $('#id_weekly_day').val();
                    scheduleData.recur_week_days = favorite ;
                    if (favorite.length  == 0){
                       is_valid = false 
                    }
                }
                else if($('#id_monthly').is(':checked')) {
                    $.each($("input[name='days']:checked"), function(){
                        favorite.push($(this).val());
                    });
                    scheduleData.recur_type = 'monthly';
                    scheduleData.recur_month_days = favorite 
                    if (favorite.length  == 0){
                       is_valid = false 
                    }
                }
            }
            function toDate(selector) {
                if(selector == '') {
                    return;
                }
                var from = selector.match(/\d+/g);
                return new Date(from[2], from[1] - 1, from[0]);
            }
            for(var data in scheduleData) {
                if(scheduleData[data] == "") {
                    sparrow.showMessage("msg", sparrow.MsgType.Error, "All fields are required.", 5);
                    return;
                }
            }
        }

         $scope.saveTaskSchedule = function(event){
            onSubmit()
            if(is_valid) {
                var postData = {
                    id: task_scheduler_id ,
                    schedule : JSON.stringify(scheduleData),
                }
                sparrow.postForm(postData, $('#frmSaveTaskSchedule'), $scope, function(data) {
                    if(data.code == 1){
                      $('#taskScheduleModel').modal('hide');
                      $scope.reloadData(1);
                    }
                });
            }
            is_valid = true;
        }
        


        sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, config, ModalService);
  });
    return taskSchedulars;
}

var taskSchedulars = taskSchedularsInit();
