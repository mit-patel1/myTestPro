(function() {
angular.module('angular-tasks', []).
    directive('angTasks', function () {
        return {
            restrict: 'AEC',
            scope: {
                appName: '@',
                modelName: '@',
                entityId: '@',   
                relatedTo : '@',                            
                tasks: '@',
                countId: '@',
                // due_date: '@'
            },
            replace: true,
            controller: function($scope, $rootScope, $http, $route, $routeParams, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, $interpolate, ModalService) {     
                if($scope.entityId === "") {
                    $scope.tasks = [];
                    return;
                }
                $scope.taskDialogTitle = '';
                var appName = $scope.appName;
                var modelName = $scope.modelName;
                var entityId = $scope.entityId;
                var title = '';
                $scope.isListView = true;
                $scope.isCalView = false;
                $scope.isKanbanView = false;
                $scope.start_length = 0;
                $scope.end_length = 0;
                $scope.total_length = 10;
                $scope.boardsIndexRecord = {};
                $scope.last_filter_text = '';
                $scope.taskData = [];
                $scope.firstTime = true;
                // $scope.readableDate = '';
                if(appName == 0 && modelName == 0 && entityId == 0){
                    title = 'Task - All task';
                    $('#idMyTask').addClass('activeTask');
                }
                else if(appName==0 && modelName=='crm'){
                    title = 'CRM - All task';
                }

                var taskListConfig = {
                    pageTitle: title,
                };

                $scope.loadListData = function(){
                    if(appName != 0 && modelName !=0 && entityId != 0){
                        setTimeout(function(){
                            $(".task-table tr td:first").css('border-top','0');
                        },200);
                    }
                    
                    sparrow.post("/task/get_tasks/"+appName+"/"+modelName+"/"+entityId+"/", {'start': 0, 'length': 30}, false, function(data){
                        $scope.$apply(function(){
                            $scope.taskData = [];
                            for(var i=0;i<data.data.length;i++){
                                $scope.taskData.push(data.data[i]);
                            }    
                        });
                    });
                };

                if(appName != 0 && modelName != 0 && entityId != 0){
                    $scope.loadListData();
                }

                $scope.changeStatus = function(taskId){
                    var statusName = '';
                    if($('#id_prog_'+taskId).hasClass('task-completed')){
                        $('#id_prog_'+taskId).addClass('task-not-started');
                        $('#id_prog_'+taskId).removeClass('task-completed');
                        $('#id_task_title_'+taskId).removeClass('task-completed-title');
                        statusName = 'not_started';
                    }
                    else if($('#id_prog_'+taskId).hasClass('task-not-started')) {
                        $('#id_prog_'+taskId).addClass('task-in-progress');
                        $('#id_prog_'+taskId).removeClass('task-not-started');
                        $('#id_task_title_'+taskId).removeClass('task-completed-title');
                        statusName = 'in_progress';
                    }
                    else if($('#id_prog_'+taskId).hasClass('task-in-progress')){
                        $('#id_prog_'+taskId).addClass('task-completed');
                        $('#id_task_title_'+taskId).addClass('task-completed-title');
                        $('#id_prog_'+taskId).removeClass('task-in-progress');
                        statusName = 'completed';
                    }
                    sparrow.post('/task/change_task_status/', {'task_id': taskId, 'status_name': statusName}, false, function(data){
                        if(data.code == 0){
                            sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                        }
                    },"json", "appMsg", undefined, undefined, undefined, {'hideLoading': true});
                };

                var appcontainerHeight = $(window).height() - ($('.nav_menu').outerHeight() + 60);
                $scope.listView = function(){
                    $('#taskTable').css('overflow-y', 'auto');
                    $('#taskTable').css('height', appcontainerHeight + 15 + "px");
                    $('#taskTable').css('display', 'block');
                    $('#task_calender').css('display', 'none');
                    $('#task_kanban').css('display', 'none');
                    $('#searchBox').css('display', 'block');
                    $('#top-layer').css('display', 'block');
                };

                $scope.calendarView = function(){
                    $('#taskTable').css('display', 'none');
                    $('#task_calender').css('overflow-y', 'auto');
                    $('#task_calender').css('height', appcontainerHeight + 15 + "px");
                    $('#task_calender').css('display', 'block');
                    $('#task_kanban').css('display', 'none');
                    $('#searchBox').css('display', 'none');
                    $('#top-layer').css('display', 'block');
                };

                $scope.loadCalendarData = function(){
                    jQuery('#task_calender').fullCalendar({
                        buttonText: {
                            today: 'Today',
                            month: 'Month',
                            week: 'Week',
                            day:  'Day'
                        },
                        header: {
                            left: 'prev,next today ',
                            center: 'title',
                            right: 'month,agendaWeek,agendaDay'
                        },

                        navLinks: true,
                        editable: true,
                        events: function(start, end, timzone, callback){
                            var current = $('#task_calender').fullCalendar('getDate');
                            currentMonth = current.format('M');
                            sparrow.post('/task/get_task_calendar/', {'current_month': currentMonth, 'model_name': modelName},false, function(data){
                                // if (data.code == 1) {
                                    $scope.$apply(function(){
                                        events = data.data;
                                    });
                                // }
                                callback(events);
                            });
                        },
                        eventClick: function(event, jsEvent, view) {
                            $scope.taskId = event.id;
                            $scope.$apply(function(){
                                $scope.editTask($scope.taskId);    
                            });
                        },
                        eventDrop: function(event, delta, revertFunc) {

                            sparrow.post('/task/change_event_date/', {'task_id': event.id, 'drop_date': event.start.format()},false, function(data){
                                if (data.code == 1) {
                                    
                                }
                                else{
                                    revertFunc();
                                }
                            });
                        },
                        eventRender: function(event, eventElement){
                            if (event.imageurl) {
                                eventElement.find("div.fc-content").prepend("<img id='taskUserImg' src='"+ event.imageurl +"' width='22' height='22'>");
                            }
                        },
                        dayClick: function(date, jsEvent, view) {
                            due_date = date.format('DD/MM/YYYY H:mm');
                            newTask(due_date);
                        }
                        
                    });
                };

                $scope.kanbanView = function(){
                    $('#taskTable').css('display', 'none');
                    $('#task_calender').css('display', 'none');
                    $('#task_kanban').css('overflow-y', 'auto');
                    $('#task_kanban').css('height', appcontainerHeight + 15 + "px");
                    $('#task_kanban').css('display', 'block');
                    $('#top-layer').css('display', 'none');
                    $scope.loadKanbanData();
                };

                $scope.loadKanbanData = function(){
                    sparrow.post('/task/task_kanban_data/', {'start_length': 0, 'end': $scope.end_length+$scope.total_length, 'model_name': modelName}, false, function(data){
                        $('.kanban-container').text('');
                        $scope.$apply(function(){
                            $scope.gridData = data.data;
                            $scope.task_status = data.all_task_status;
                        });
                        for(var i=0; i<$scope.task_status.length; i++){
                            $scope.boardsIndexRecord[$scope.task_status[i]] = {'start_length': 0, 'end_length': 10};
                        }
                        $scope.kanban = new jKanban({
                            element:'.kanban-container',
                            boards  : $scope.gridData,
                            dragBoards : false,
                            dropEl: changeTaskStatus,
                            click: taskEdit
                        });
                        var height = $(window).height() - 135;
                        $('.kanban-board').css('max-height', height+'px');
                        var dragheight = height - 50;
                        $('.kanban-drag').css('max-height', dragheight+'px');
                        $('.kanban-item').hover(function(){
                            $(this).css('cursor', 'pointer');
                        });
                        $('.kanban-board').css('width', (parent.document.body.clientWidth/3 - 120)+'px');

                        jQuery(function($) {
                            $('.kanban-drag').on('scroll', function() {
                                if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                                    var status_name = $(this).parent('div').attr('data-id');
                                    var item = [];
                                    sparrow.post('/task/task_kanban_data/', {'status_name': status_name, 'start_length': $scope.boardsIndexRecord[status_name].start_length, 'end': $scope.boardsIndexRecord[status_name].end_length}, false, function(data){
                                        $scope.$apply(function(){
                                            item = data.data[0].item;
                                            if(item.length > 0){
                                                $scope.boardsIndexRecord[status_name].start_length = $scope.boardsIndexRecord[status_name].end_length;
                                                $scope.boardsIndexRecord[status_name].end_length += $scope.total_length;
                                                for(var i=0; i<item.length; i++){
                                                    $scope.kanban.addElement(
                                                        status_name,
                                                        item[i]
                                                    );
                                                }
                                            }
                                        });
                                    }, "json", "appMsg", undefined, undefined, undefined, {'hideLoading': true});
                                }
                            });
                        });
                    }, "json", "appMsg", undefined, undefined, undefined, {'hideLoading': true});
                };

                $(document).off('click', '#taskKanbanView');
                $(document).on('click', '#taskKanbanView', function(){
                    if ($scope.last_filter_text != '' && $('#basePageTitle').text() == 'Task - All task' ) {
                        $('#basePageTitle').text($scope.last_filter_text);
                    }
                    else if($('#basePageTitle').text() == 'Task - All task' || $scope.last_filter_text == '' ){
                        $('#basePageTitle').text('Task - My task');
                    }
                    $('#taskKanbanView').addClass('active-view');
                    $('#btnListView').removeClass('active-view');
                    $('#btnCalendarView').removeClass('active-view');
                    $('#taskTable').off('scroll');

                    $scope.isListView = false;
                    $scope.isKanbanView = true;
                    $scope.isCalView = false;
                    sparrow.setCookie('TaskDefaultView', "KanbanView");
                    $scope.kanbanView(1);
                });

                $(document).off('click', '#btnCalendarView');
                $(document).on('click', '#btnCalendarView', function(){
                    if ($scope.last_filter_text != '' && $('#basePageTitle').text() == 'Task - All task' ) {
                        $('#basePageTitle').text($scope.last_filter_text);
                    }
                    else if($('#basePageTitle').text() == 'Task - All task' || $scope.last_filter_text == '' ){
                        $('#basePageTitle').text('Task - My task');
                    }
                    $('#btnCalendarView').addClass('active-view');
                    $('#btnListView').removeClass('active-view')
                    $('#taskKanbanView').removeClass('active-view')
                    sparrow.setCookie('TaskDefaultView', "CalendarView");
                    $('#taskTable').off('scroll');

                    $scope.isListView = false;
                    $scope.isKanbanView = false;
                    $scope.isCalView = true;
                    $scope.loadCalendarData();
                    $scope.calendarView();
                    $(window).trigger('resize');
                });

                $(document).off('click', '#btnListView');
                $(document).on('click', '#btnListView', function(){
                    var start_list_length = 0;
                    var end_list_length = 20;
                    // var sort=[
                    //         {'id':'due_date', 'name':'Due date'},
                    //         {'id':'assign_to', 'name':'Assignee' },
                    //         {'id':'alphabetical', 'name':'Alphabetical(A <span class=icon-arrow-2-right style="vertical-align: middle"></span> Z)'}
                    //     ]
                    
                    var sortColumns = '';
                    if ($scope.last_filter_text != '' && $('#basePageTitle').text() == 'Task - All task' ) {
                        $('#basePageTitle').text($scope.last_filter_text);
                    }
                    else if($('#basePageTitle').text() == 'Task - All task' || $scope.last_filter_text == '' ){
                        $('#basePageTitle').text('Task - My task');
                        if(appName == 0 && modelName == 'crm'){
                            $('#basePageTitle').text('CRM - All task');
                        }
                    }
                    // setAutoLookup('idSort',sort,'');
                    
                    $('#btnCalendarView').removeClass('active-view')
                    $('#btnListView').addClass('active-view');
                    $('#taskKanbanView').removeClass('active-view')
                    sparrow.post("/task/get_tasks/"+appName+"/"+modelName+"/"+entityId+"/", {'start': start_list_length, 'length': end_list_length, 'columns':sortColumns}, false, function(data){
                        $scope.$apply(function(){
                            $scope.taskData = data.data;
                            start_list_length = end_list_length;
                            end_list_length = start_list_length + 50; 
                        });
                    });

                    $('#taskTable').off('scroll');
                    $('#taskTable').on('scroll', function() {
                        if(start_list_length < end_list_length){
                            if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                                sparrow.post("/task/get_tasks/"+appName+"/"+modelName+"/"+entityId+"/", {'start': start_list_length, 'length': end_list_length}, false, function(data){
                                    $scope.$apply(function(){
                                        for(i=0;i<data.data.length;i++){
                                            $scope.taskData.push(data.data[i]);
                                       } 
                                    });
                                    start_list_length =  end_list_length;
                                    end_list_length = start_list_length + 50
                                    if(end_list_length >= data.user_count){
                                        end_list_length = data.user_count;
                                    } 
                                },"json", "appMsg", undefined, undefined, undefined, {'hideLoading': true});
                            }
                        }
                        
                    });

                    // var msSort = $('#idSort').magicSuggest();
                    // $(msSort).on('selectionchange',function(e,m){
                    //     sortColumns = $("#hid_sort").val();
                    //     $scope.filterTask(sortColumns);
                    // });
                    
                    sparrow.setCookie('TaskDefaultView', "ListView");
                    $scope.isListView = true;
                    $scope.isKanbanView = false;
                    $scope.isCalView = false;
                    $scope.listView();
                    $(window).trigger('resize');
                });

                $scope.getReadableDate = function(due_date,due_date_year){
                    $scope.readableDate = '';
                    var moment_now = moment(new Date());
                    var moment_end = moment(moment(due_date, "DDMMYYYY"));
                    if(due_date == ''){
                        return $scope.readableDate;
                    }
                    if(Math.abs(moment_now.diff(moment_end, 'days')) <= 6){
                        $scope.readableDate = moment(due_date, "DDMMYYYY h:mm").calendar();
                        $scope.readableDate = $scope.readableDate.substring(0, $scope.readableDate.indexOf(' at '));
                    }   
                    else{
                     if(moment(new Date().getFullYear()) != due_date_year){
                        $scope.readableDate = moment(due_date, "DDMMYYYY").format('MMM D, YYYY');
                     }
                     else{
                        $scope.readableDate = moment(due_date, "DDMMYYYY").format('MMM D');    
                     }
                    }
                    return $scope.readableDate;
                };

                if(appName == 0 || modelName == 0){
                    $('#top_action_bar').html('');
                    $('#top_action_bar').append('<style>.dropdown-menu-org{min-width: 260px;min-height: 315px}.dropdown-menu-org > li > input{display:none}.dropdown-item{margin-bottom:20px}.active-view{font-weight: 700; color: #EF7878}</style>\
                        <div class="focus-inner button-bar">\
                        <i type="button" class="icon-list-bullets listView" title="List view" id="btnListView"></i>\
                        <i type="button" class="icon-calendar calendarView" title="Calendar view" id="btnCalendarView"></i>\
                        <span type="button" class="icon-hamburger-menu-1 kanban-task" title="Kanban view" id="taskKanbanView"></span>\
                        <input type="button" id="btnAddTask" class="btn btn-primary btn-sm" value="Add new"></input>\
                            <div class="btn-group">\
                                <button type="button" class="btn btn-default dropdown-toggle" style="padding: 0px 7px 2px;font-size: 17px;" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" >\
                                    <i class="icon-hamburger-menu-1" aria-hidden="true"></i>\
                                </button>\
                                <ul class="dropdown-menu dropdown-menu-org dropdown-menu-right" style="padding: 10px 20px;pointer-events: auto;">\
                                    <li class="dropdown-item">\
                                        <label>View</label>\
                                    </li>\
                                    <li class="dropdown-item">\
                                        <input type="radio"  name="sort" class="magic-radio" id="idMyDue" value=""></input>\
                                        <label for="idMyDue">My overdue task</label>\
                                    </li >\
                                    <li class="dropdown-item">\
                                        <input type="radio" name="sort" class="magic-radio" id="idOverdue" ></input>\
                                        <label for="idOverdue">Overdue task</label>\
                                    </li>\
                                    <li class="dropdown-item">\
                                        <input type="radio" name="sort" class="magic-radio" id="idMyTask" value=""></input>\
                                        <label for="idMyTask">My task</label>\
                                    </li>\
                                    <li class="dropdown-item">\
                                    <input type="radio" name="sort" class="magic-radio" id="idCompleted" value=""></input>\
                                        <label for="idCompleted">Completed task</label>\
                                    </li>\
                                    <li class="dropdown-item">\
                                    <input type="radio" name="sort" checked class="magic-radio" id="idAll" value=""></input>\
                                        <label for="idAll">All task</label>\
                                    </li>\
                                    <li>\
                                        <label>Sort</label>\
                                    </li>\
                                    <li>\
                                        <input type="text" class="form-control" name="sort" id="idSort" value=""></input>\
                                    </li>\
                                </ul>\
                            </div>\
                        </div>');
                        var sort=[
                            {'id':'due_date', 'name':'Due date'},
                            {'id':'assign_to', 'name':'Assignee' },
                            {'id':'alphabetical', 'name':'Alphabetical(A <span class=icon-arrow-2-right style="vertical-align: middle"></span> Z)'}
                        ]

                        setAutoLookup('idSort',sort,'');

                        $('#idMyDue').off('click');
                        $('#idMyDue').on('click',function(){
                            $scope.filterTask('my_due');
                        });
                        $('#idAll').off('click');
                        $('#idAll').on('click',function(){
                            $scope.filterTask('all');
                        });
                        $('#idOverdue').off('click');
                        $('#idOverdue').on('click',function(){
                            $scope.filterTask('overdue');
                        });
                        $('#idCompleted').off('click');
                        $('#idCompleted').on('click',function(){
                            $scope.filterTask('completed');
                        });
                        $('#idMyTask').off('click');
                        $('#idMyTask').on('click',function(){
                            $scope.filterTask('my');
                        });

                        var msSort = $('#idSort').magicSuggest();
                        $(msSort).on('selectionchange',function(e,m){
                            sortColumns = $("#hid_sort").val();
                            $scope.filterTask(sortColumns);
                        });

                        $('body').on("click", ".dropdown-menu", function (e) {
                            $(this).parent().is(".open") && e.stopPropagation();
                        });
                        

                    defaultView = sparrow.getCookie('TaskDefaultView');
                    if (defaultView == 'KanbanView') {
                        $scope.firstTime = false;
                        $("#taskKanbanView" ).trigger( "click");
                    }
                    else if(defaultView == 'ListView'){
                        $scope.firstTime = false;
                        $( "#btnListView" ).trigger( "click");
                    }
                    else if(defaultView == 'CalendarView'){
                        $scope.firstTime = false;
                        $( "#btnCalendarView" ).trigger( "click");
                    }
                    else{
                        $scope.firstTime = false;
                        $( "#btnListView" ).trigger( "click");
                    }
                }
                
                $(document).off('click', '#btnAddTask')
                $(document).on('click', '#btnAddTask', function(){
                    newTask(0);
                });

                $(document).off('click', '#addTask');
                $(document).on('click', '#addTask', function(){
                    newTask(0);
                });

                function changeTaskStatus(el, target, source, sibling){
                    task_id = $(el).attr('data-eid');
                    status_name = $(target).parent('div').attr('data-id');
                    current_status = $(source).parent('div').attr('data-id');
                    if (current_status == status_name) {
                        return false;
                    }
                    sparrow.post('/task/change_task_status/', {'task_id': task_id, 'status_name': status_name}, false, function(data){
                        if(data.code == 0){
                            sparrow.showMessage("appMsg", sparrow.MsgType.Error, data.msg, 10);
                        }else{
                            // $route.reload();
                            $('#loading-image').hide();
                        }
                    }, "json", "appMsg", undefined, undefined, undefined, {'hideLoading': true});
                }

                function taskEdit(el){
                    var task_id = $(el).attr('data-eid');
                    $scope.$apply(function(){
                        $scope.editTask(Number(task_id));
                    });
                }

                function newTask(due_date){
                    $('#delete_task').hide();
                    $scope.$apply(function(){
                        $scope.taskDialogTitle = "Add Task";
                    });
                    $scope.taskId = 0;
                    showTaskForm(0, due_date);
                }

                $scope.editTask =function (taskId){
                    $('#delete_task').show();
                    $('#delete_task').attr('taskId', taskId);
                    $scope.taskDialogTitle = "Edit Task";
                    $scope.taskId = taskId;
                    showTaskForm(taskId);
                }
                
                function showTaskForm(taskId, setDueDate){
                    sparrow.post("/task/task/", {id : taskId}, false, function(data) {

                        $('#taskMsg').hide();
                        var height = $(window).height() - 120;
                        $('#idTaskModel').css('height', height + 'px');
                        $compile($('#frmTask').html(data))($scope);

                        var msTaskStatusData = [];
                        var msTaskPriorityData = [];
                        var task_reminder=[
                            {'id':'30_MIN_BFR', 'name':'30 minutes before'},
                            {'id':'1_HR_BFR', 'name':'01 hour before' },
                            {'id':'3_HR_BFR', 'name':'03 hours before'},
                            {'id':'6_HR_BFR', 'name':'06 hours before'},
                            {'id':'24_HR_BFR', 'name':'24 hours before'},
                            {'id':'OTHER', 'name':"Other"}]

                        task_status_id = Object.keys(task_data.task_status);
                        task_priority_id = Object.keys(task_data.task_priority);
                        for(var i=0 ; i<task_status_id.length; i++){
                            msTaskStatusData.push({
                                'id': task_status_id[i],
                                'name': task_data.task_status[task_status_id[i]]
                            })
                        }
                        for(var j=0; j< task_priority_id.length;j++){
                            msTaskPriorityData.push({
                                'id': task_priority_id[j],
                                'name': task_data.task_priority[task_priority_id[j]]
                            })
                            
                            if(task_priority_id[j]=='low'){msTaskPriorityData[j].name='<span style="background-color:#75bddf;color: #fff;padding:2px 4px;border-radius: 6px;">'+msTaskPriorityData[j].name+'</span>';}
                            else if(task_priority_id[j]=='high'){msTaskPriorityData[j].name='<span style="background-color:#EF7878;color: #fff;padding:2px 4px;border-radius: 6px;">'+msTaskPriorityData[j].name+'</span>';}
                            else if(task_priority_id[j]=='medium'){msTaskPriorityData[j].name='<span style="background-color:#feb739;color: #fff;padding:2px 4px;border-radius: 6px;">'+msTaskPriorityData[j].name+'</span>';}
                            else if(task_priority_id[j]=='urgent'){msTaskPriorityData[j].name='<span style="background-color:red;color: #fff;padding:2px 4px;border-radius: 6px;">'+msTaskPriorityData[j].name+'</span>';}
                            else{msTaskPriorityData[j].name=''}
                        }
                        setAutoLookup('id_reminder_on', task_reminder, '');
                        setAutoLookup('id_task_status', msTaskStatusData , '');
                        setAutoLookup('id_task_priority', msTaskPriorityData , '');
                        
                        setAutoLookup('id_assign_to','/b/lookups/users/', '');

                        var ms = $('#id_reminder_on').magicSuggest();
                        $(ms).on('selectionchange',function(e,m){
                            value = $("#hid_reminder_on").val();
                            if (value == 'OTHER') {
                                $('.showReminder').css('display', 'block');
                            }
                            else{
                                $('#id_due_date').attr('value', getCurrentDate());
                                $('.showReminder').css('display', 'none');
                            }
                        });
                        $('#TaskModel').modal('show'); 
                        if (taskId == 0 && setDueDate != 0) {
                            $('#id_due_date').val(setDueDate);
                            showSelectOption();
                        }

                        sparrow.setControlFocus('#id_task_name');
                    }, 'html');
                }

                function getCurrentDate(){
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!

                    var yyyy = today.getFullYear();
                    if(dd<10){
                        dd='0'+dd;
                    } 
                    if(mm<10){
                        mm='0'+mm;
                    }
                    return dd+'/'+mm+'/'+yyyy+' 00:00';
                }

                $scope.deleteTask = function(){
                    var taskId = $(this).attr('taskId');
                    sparrow.showConfirmDialog(ModalService, "Are you sure, want to remove task?", "Remove task",function(confirm) {
                        if(confirm) { 
                            sparrow.post("/task/task_delete/", {id : taskId}, false, function(data) {
                                if(data.code == 1){
                                    $('#TaskModel').modal('hide');
                                    $(".modal-backdrop").remove();
                                    $route.reload();
                                    $('#task_calender').fullCalendar('destroy');
                                    $scope.loadCalendarData();
                                    $scope.loadKanbanData();
                                    sparrow.showMessage("appMsg", sparrow.MsgType.Success, data.msg, 10);
                                }
                            });
                        }
                    });
                }

                sparrow.setup($scope, $rootScope, $route, $compile, DTOptionsBuilder, DTColumnBuilder, $templateCache, taskListConfig, ModalService);   
            },
            link: function (scope, elem, attrs, route) {

                scope.saveTask = function () {                    
                    if(scope.entityId === "") {
                        sparrow.showMessage("appMsg", sparrow.MsgType.Error, "Please create record before adding remark.", 10);
                        return
                    }
                    var postData = {
                        app_name: scope.appName,
                        model_name: scope.modelName,
                        entity_id: scope.entityId,
                        related_to : scope.relatedTo,
                        task_id : scope.taskId,
                    }

                    sparrow.postForm(postData, $('#frmTask'), scope, function(data) {
                        if(data.code == 1){
                            $('#taskMsg').hide();
                            $('#TaskModel').modal('hide');
                            $('#btnListView').trigger('click');
                            $('#task_calender').fullCalendar('destroy');
                            scope.loadCalendarData();
                            scope.loadKanbanData();
                            if(scope.appName){
                                scope.loadListData();
                            }
                            sparrow.showMessage("appMsg", sparrow.MsgType.Success, data.msg, 10);
                        }
                    });                    
                };


                scope.getURL = function(event, appName, modelName, entityId,related_to, type) {
                    event.stopPropagation();
                    url = sparrow.getEntityIframeURL(appName, modelName, entityId, related_to, type)
                    scope.onEditLink(url, related_to);
                };

                scope.filterTask = function(taskFilter){
                    sparrow.setCookie('taskFilter',taskFilter);
                    if(taskFilter == 'my'){
                        scope.last_filter_text = 'Task - My task';
                        if(scope.appName==0 && scope.modelName=='crm'){
                            scope.last_filter_text = 'CRM - My task';
                        }
                        $('#idMyTask').addClass('activeTask');
                    }
                    if(taskFilter == 'all'){
                        scope.last_filter_text = 'Task - All task';
                        if(scope.appName==0 && scope.modelName=='crm'){
                            scope.last_filter_text = 'CRM - All task';
                        }
                        $('#idAll').addClass('activeTask');
                    }
                    if(taskFilter == 'overdue'){
                        scope.last_filter_text = 'Task - Overdue task';
                        if(scope.appName==0 && scope.modelName=='crm'){
                            scope.last_filter_text = 'CRM - Overdue task';
                        }
                        $('#idOverdue').addClass('activeTask');
                    } 
                    if(taskFilter == 'completed'){
                        scope.last_filter_text = 'Task - Completed task';
                        if(scope.appName==0 && scope.modelName=='crm'){
                            scope.last_filter_text = 'CRM - Completed task';
                        }
                    }
                    if(taskFilter == 'my_due'){
                        scope.last_filter_text = 'Task - My overdue task';
                        if(scope.appName==0 && scope.modelName=='crm'){
                            scope.last_filter_text = 'CRM - My overdue task';
                        }
                    }
                    if(taskFilter == 'due_date' || taskFilter == 'assign_to' || taskFilter == 'alphabetical'){
                        $('#idMyTask').prop('checked','false')
                        $('#idAll').prop('checked','false')
                        if(scope.appName==0 && scope.modelName=='crm'){
                            scope.last_filter_text = 'CRM - All task';
                        }
                    }
                    $('#basePageTitle').text(scope.last_filter_text);
                    if(scope.isListView){
                        $('#btnListView').trigger('click');
                        $('#task_calender').fullCalendar('destroy');
                        scope.loadListData();
                    }
                    else if(scope.isCalView){
                        $('#btnCalendarView').trigger('click');
                        $('#task_calender').fullCalendar('destroy');
                        scope.loadCalendarData();;
                    }else if(scope.isKanbanView){
                        $('#taskKanbanView').trigger('click');
                        $('#task_calender').fullCalendar('destroy');
                    }
                };
                // scope.filterTask('all');
            },
            templateUrl: function(element, attr) {
                return attr.templateUrl || 'angular-tasks.html';
            },
        }
    });
})();

angular.module('angular-tasks').run(['$templateCache', function($templateCache) {
    'use strict';
    $templateCache.put('angular-tasks.html',    
      '<div class="ang-task lst-container"> \
        <style>\
            .filterClass span{\
                margin:6px;\
                padding-right: 2px;\
            }\
            .filterClass a:hover{\
                text-decoration: underline;\
            }\
            .activeTask{\
                text-decoration: underline;\
            }\
            .descClass{\
                display:inline-block;\
                width:250px;\
                white-space: nowrap;\
                overflow:hidden !important;\
                text-overflow: ellipsis;\
            }\
            .calendarView{\
                padding-right: 20px;\
                cursor: pointer;\
                font-size: 17px;\
                vertical-align: middle;\
            }\
            .listView{\
                padding-right: 10px;\
                cursor: pointer;\
                font-size: 18px;\
                vertical-align: middle;\
            }\
            .fc-content{\
                font-size: 12px;\
            }\
            .fc-time{\
                margin-left: 5px;\
            }\
            #taskUserImg {\
                border-radius: 50%;\
            }\
            .advancedSearchBox {\
                position: inherit;\
            }\
            ul.dropdown-menu{\
                width: 77% !important;\
            }\
            .kanban-task{\
                padding-right: 20px;\
                margin-left: -9px;\
                cursor: pointer;\
                font-size: 17px;\
                vertical-align: middle;\
                -webkit-transform: rotate(45deg);\
                -moz-transform: rotate(45deg);\
                -ms-transform: rotate(45deg);\
                -o-transform: rotate(45deg);\
                transform: rotate(90deg);\
                transform-origin: 20% 40%;\
                display: inline-block;\
            }\
            .lead-name{\
                font-size: 15px;\
            }\
            .lead-phone{\
                font-size: 12px;\
                padding-top: 10px;\
            }\
            .icon-answer{\
                padding-right: 3px;\
            }\
            .not-show{\
                display: none;\
            }\
            .kanban-board, .kanban-item{\
                 border-radius: 4px;\
            }\
            .kanban-title-board{\
                 color: #505051;\
                 font-weight: normal !important;\
            }\
            .kanban-item{\
                border-radius: 3px;\
                box-shadow: 0 1px 0 #ccc;\
                cursor: pointer;\
                padding:11px !important\
            }\
            .lead-source{\
                color: #797979;\
                padding-top: 7px;\
            }\
            .kanban-drag{\
                display: flex;\
                flex-direction: column;\
                overflow: auto;\
            }\
            .kanban-board{\
                overflow: hidden;\
                background: #efefef;\
            }\
            .icon-list-1{\
                font-size: 19px;\
                cursor: pointer;\
                padding-right: 7px;\
                vertical-align: middle;\
            }\
            .kanban-container{\
                display: inline-block;\
                margin-top: 10px;\
                width: 100% !important;\
            }\
            footer{\
                display: none;\
            }\
            .inProgress{\
                background-color: #fbd093;\
            }\
            .notStarted{\
                background-color: #d4d4d4;\
            }\
            .completed{\
                background-color: #afe4e4;\
            }\
            .inProgress .kanban-title-board{\
                color: #8a5000;\
            }\
            .notStarted .kanban-title-board{\
                color: #2b2b2b;\
            }\
            .completed .kanban-title-board{\
                color: #006d6d;\
            }\
            .kanbanDueDate{\
                float: right;\
                font-size: 12px;\
                color: #fff;\
                padding:2px 4px;\
                border-radius: 6px;\
            }\
            .assignName{\
                margin-left: 5px;\
                font-size: 13px;\
            }\
            .task-completed{\
                color: #27ae60 !important\
            }\
            .task-completed-title{\
                color: #989898\
            }\
            .task-not-started{\
                color:grey !important\
            }\
            .task-in-progress{\
                color: #FFA500 !important\
            }\
            .no-task{\
                text-align: center;\
                color: #808080;\
                font-size: 18px;\
            }\
        </style>\
        <div class="tasks-container">\
           <div id="taskTable">\
           <div ng-if="taskData.length == 0">\
                <div class="no-task">\
                    <div>No task available.</div>\
                </div>\
            </div>\
            <table class="table task-table" style="margin-top:10px;">\
                <tr ng-repeat="task in taskData track by $index">\
                    <td>\
                        <div class="container">\
                            <div ng-if="appName == 0" class="col-sm-1" style="width: 6%">\
                                {{task.task_id}}\
                            <span ng-if="task.status ==\'In progress\'" title="Mark complete" id="id_prog_{{task.task_id}}" class ="icon-check-circle col-sm-1 task-in-progress" ng-click = changeStatus(task.task_id) style = "color:#FFA500; cursor: pointer ;font-size: 20px; width: 2% ; float:right"></span>\
                            <span ng-if="task.status == \'Completed\'" title="Mark not started" id="id_prog_{{task.task_id}}" class ="icon-check-circle col-sm-1 task-completed" ng-click = changeStatus(task.task_id) style = "color:#27ae60; cursor: pointer ;font-size: 20px; width: 2% ; float:right "></span>\
                            <span ng-if="task.status == \'Not started\' || task.status == null" id="id_prog_{{task.task_id}}" title="Mark in progress" class ="icon-check-circle col-sm-1 task-not-started" ng-click = changeStatus(task.task_id) style = "color:grey; cursor: pointer ;font-size: 20px; width: 2% ; float:right "></span>\
                            </div>\
                            <div ng-if="appName == 0" class="col-sm-11" ng-click="editTask(task.id)" style="cursor:pointer;width: 94%;">\
                                <div class="col-sm-9">\
                                    <span id="id_task_title_{{task.task_id}}" style="margin-left: 10px" ng-class = "{\'task-completed-title\': task.status == \'Completed\'}">\
                                    {{task.name}}</span>\
                                    <span ng-if="task.related_to" style="color:#989898" >\
                                    <a class="link-iframe-item" ng-click="getURL($event, task.appName, task.modelName, task.entityId,task.related_to,task.type)"> #{{task.related_to}}</a> </span>\
                                </div>\
                                <div class="col-sm-3" style="text-align:right; float:right;padding-right: 0px;">\
                                    <span ng-if="task.remarks" style="font-size:16px; margin-right:5px;color: #989898"><i class="icon-message-3-write"></i></span>\
                                    <span ng-if="task.priority == \'Urgent\'" style="background-color:red;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.priority == \'Low\'" style="background-color:#75bddf;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.priority == \'Medium\'" style="background-color:#feb739;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.priority == \'High\'" style="background-color:#EF7878;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.is_due" style="margin-left: 10px;font-size: 12px; color:#EF7878;">{{getReadableDate(task.due_date,task.due_date_year)}}</span>\
                                    <span ng-if="!task.is_due" style="margin-left: 10px;font-size: 12px;">{{getReadableDate(task.due_date,task.due_date_year)}}</span>\
                                    <span ng-if="task.img_src" style="margin-left: 10px;"><img id="taskUserImg" src="{{task.img_src}}" width="25" height="25" title="{{task.assign_to}}" style="border-radius: 50%;"></span></div>\
                                </div>\
                            </div>\
                            <div ng-if="appName != 0" class="col-sm-1" style="width: 4%">\
                            <span ng-if="task.status ==\'In progress\'" title="Mark complete" id="id_prog_{{task.task_id}}" class ="icon-check-circle col-sm-1 task-in-progress" ng-click = changeStatus(task.task_id) style = "color:#FFA500; cursor: pointer ;font-size: 20px; width: 2% ; float:right"></span>\
                            <span ng-if="task.status == \'Completed\'" title="Mark not started" id="id_prog_{{task.task_id}}" class ="icon-check-circle col-sm-1 task-completed" ng-click = changeStatus(task.task_id) style = "color:#27ae60; cursor: pointer ;font-size: 20px; width: 2% ; float:right "></span>\
                            <span ng-if="task.status == \'Not started\' || task.status == null" id="id_prog_{{task.task_id}}" title="Mark in progress" class ="icon-check-circle col-sm-1 task-not-started" ng-click = changeStatus(task.task_id) style = "color:grey; cursor: pointer ;font-size: 20px; width: 2% ; float:right "></span>\
                            </div>\
                            <div ng-if="appName != 0" class="col-sm-11" ng-click="editTask(task.id)" style="cursor:pointer;width: 96%;">\
                                <div class="col-sm-9">\
                                    <span id="id_task_title_{{task.task_id}}" style="margin-left: 10px" ng-class = "{\'task-completed-title\': task.status == \'Completed\'}">\
                                    {{task.name}}</span>\
                                    <span ng-if="task.related_to" style="color:#989898" > #{{task.related_to}}</span>\
                                </div>\
                                <div class="col-sm-3" style="text-align:right; float:right;padding-right: 0px;">\
                                    <span ng-if="task.remarks" style="font-size:16px; margin-right:5px;color: #989898"><i class="icon-message-3-write"></i></span>\
                                    <span ng-if="task.priority == \'Urgent\'" style="background-color:red;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.priority == \'Low\'" style="background-color:#75bddf;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.priority == \'Medium\'" style="background-color:#feb739;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.priority == \'High\'" style="background-color:#EF7878;color: #fff;padding:3px 8px;border-radius: 20px;font-size:12px">{{task.priority}}</span>\
                                    <span ng-if="task.is_due" style="margin-left: 10px;font-size: 12px; color:#EF7878;">{{getReadableDate(task.due_date,task.due_date_year)}}</span>\
                                    <span ng-if="!task.is_due" style="margin-left: 10px;font-size: 12px;">{{getReadableDate(task.due_date,task.due_date_year)}}</span>\
                                    <span ng-if="task.img_src" style="margin-left: 10px;"><img id="taskUserImg" src="{{task.img_src}}" width="25" height="25" title="{{task.assign_to}}" style="border-radius: 50%;"></span></div>\
                                </div>\
                            </div>\
                        </div>\
                    </td>\
                </tr>\
            </table>\
            </div>\
            <div id="task_calender" style="display: none;"></div>\
            <div id="task_kanban" style="display: none;">\
                <div class="kanban-container"></div>\
            </div>\
            <div id="TaskModel" class="modal right fade" role="dialog">\
                <div class="modal-dialog" role="document">\
                    <div class="modal-content">\
                        <div class="modal-header">\
                            <button type="button" class="close spw-close" data-dismiss="modal" aria-label="Close">\
                                <span aria-hidden="true">&times;</span>\
                            </button>\
                            <h4 class="modal-title" id="taskLabel" ng-bind="taskDialogTitle"></h4>\
                        </div>\
                        <div class="modal-body" id="idTaskModel" style="overflow-y: auto;">\
                            <div id="taskform">\
                                <form id="frmTask" action="/task/save_task/" method="POST" role="form" class="form-horizontal"></form>\
                            </div>\
                            <div id="taskMsg"></div>\
                        </div>\
                        <div class="modal-footer">\
                            <a href="" id="delete_task" ng-click="deleteTask($event);" style="text-decoration: underline;float: left;margin-top: 15px;">Delete task</a>\
                            <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>\
                            <input type="button" class="btn btn-primary" ng-click="saveTask();" id="id_save_task" value="Save" />\
                        </div>\
                    </div>\
                </div>\
            </div>     \
        </div>   \
    </div>'
  );
  
  }]);