sparrow.config([
  "$routeProvider",
  "$controllerProvider",
  function ($routeProvider, $controllerProvider) {
    sparrow.registerCtrl = $controllerProvider.register;

    //Attachment controller
    //TODO: Need to add controller in proper file. Can't add in base.js because registerCtrl initializing in route.js and it is loadig after base.js?v=11.7.

    sparrow.registerCtrl("AttachmentController", function (
      $scope,
      $element,
      objectId,
      appName,
      model,
      title,
      close
    ) {
      $scope.title = title;
      $scope.appName = appName;
      $scope.modelName = model + "_attachment";

      var postData = {
        id: 0, //To clear form after upload file.
        object_id: objectId,
        app: appName,
        model: $scope.modelName,
      };

      sparrow.post("/attachment/get_attachments/", postData, false, function (
        result
      ) {
        $scope.$applyAsync(function () {
          if (result.data.length == 0) {
            $scope.noData = "No attachment available.";
          }
          $scope.attachments = result.data;
        });
      });

      $scope.uploadfile = function () {
        sparrow.postForm(postData, $("#frmAttachment"), $scope, function (
          result
        ) {
          $scope.$applyAsync(function () {
            var attachment = result.data[0];
            if (attachment) {
              $("#noData").hide();
            }
            $("#id_file_type").val($("#id_file_type option:first").val());
            $scope.attachments.push(attachment);
          });
        });
      };

      $scope.delete = function (element) {
        var id = element.attachment.id;
        postData["id"] = id;

        sparrow.post(
          "/attachment/del_attachment/",
          postData,
          true,
          function (data) {
            if (data.code == 1) {
              $.each($scope.attachments, function (i) {
                if (this.id == id) {
                  $scope.$applyAsync(function () {
                    $scope.attachments.splice(i, 1);
                    if ($scope.attachments.length == 0) {
                      $("#noData").show();
                    }
                  });
                  return false;
                }
              });
            }
          },
          "json",
          "msg"
        );
      };

      $scope.cancel = function () {
        $element.modal("hide");

        //Handled an issue when closing model dialog, back area was disable.
        $(".modal-backdrop").remove();

        close({}, 500);
      };
    });
    //Attachment controller ends

    function loadScript(path) {
      var result = $.Deferred(),
        script = document.createElement("script");
      script.async = "async";
      script.type = "text/javascript";
      script.src = sparrow.getStaticUrl() + path;
      script.onload = script.onreadystatechange = function (_, isAbort) {
        if (!script.readyState || /loaded|complete/.test(script.readyState)) {
          if (isAbort) result.reject();
          else result.resolve();
        }
      };
      script.onerror = function () {
        result.reject();
      };
      var scriptContainer =
        $("#viewContainer").length != 0
          ? document.getElementById("viewContainer")
          : document.querySelector("body");
      scriptContainer.appendChild(script);
      return result.promise();
    }

    function loader(arrayName) {
      return {
        load: function ($q) {
          var deferred = $q.defer(),
            map = arrayName.map(function (name) {
              return loadScript(name);
            });
          $q.all(map).then(function (r) {
            deferred.resolve();
          });
          return deferred.promise;
        },
      };
    }

    $routeProvider
      .when("/search", {
        templateUrl: "/base/search/",
        controller: "appSearchCtrl",
        resolve: loader(["base/js/app_search.js"]),
      })
      .when("/base/release_note", {
        templateUrl: "/base/release_note/",
        controller: "releaseNoteCtrl",
        resolve: loader(["base/js/release_note.js?v=12.4"]),
      })
      .when("/dashboard", {
        templateUrl: '/datafox/datafox_dashboard/',
        controller: 'datafoxDashboardSelectOperatorCtrl',
        resolve: loader(['datafox/js/datafox_dashboard.js?v=0.10']),

      })
      .when("/", {
        templateUrl: '/base/dashboard/',
      })
      .when("/base/reports/:id", {
        name: "reports",
        templateUrl: function (urlattr) {
          $("#loading-image").show();
          return "/base/reports/" + urlattr.id + "/";
        },
        controller: "reportsCtrl",
        resolve: loader(["base/js/report.js?v=13.9"]),
      })
      .when("/base/model_reports/:type", {
        templateUrl: "/base/model_reports/",
        controller: "modelReportsCtrl",
        resolve: loader(["base/js/model_reports.js?v=0.8"]),
      })
      .when("/auditlog/logs/:model/:ids", {
        templateUrl: function (urlattr) {
          return "/auditlog/logs/" + urlattr.model + "/" + urlattr.ids + "/";
        },
        controller: "logsCtrl",
        resolve: loader(["auditlog/js/logs.js?v=12.4"]),
      })
      .when("/auditlog/power_logs/:model/:ids", {
        templateUrl: function (urlattr) {
          return "/auditlog/power_logs/" + urlattr.model + "/" + urlattr.ids + "/";
        },
        controller: "powerlogsCtrl",
        resolve: loader(["auditlog/js/power_logs.js?v=12.4"]),
      })
      .when("/accounts/profile", {
        templateUrl: "/accounts/profile/",
        controller: "profileCtrl",
        resolve: loader([
          "accounts/js/profile.js?v=13.0",
          "base/js/jqColorPicker.min.js?v=12.0",
          "base/js/colors.js?v=12.0",
        ]),
      })
      .when("/accounts/users/", {
        templateUrl: "/accounts/users/",
        controller: "usersCtrl",
        resolve: loader(["accounts/js/users.js?v=1.9"]),
      })
      .when("/accounts/user/:id", {
        name: "user",
        templateUrl: function (urlattr) {
          return "/accounts/user/" + urlattr.id + "/";
        },
        controller: "userCtrl",
        resolve: loader(["accounts/js/user.js?v=13.6"]),
      })
      .when("/messaging/notifications", {
        templateUrl: "/messaging/notifications/",
        controller: "notificationsCtrl",
        resolve: loader(["messaging/js/notifications.js?v=2.7"]),
      })
      .when("/messaging/messages", {
        templateUrl: "/messaging/messages/",
        controller: "messagesCtrl",
        resolve: loader(["messaging/js/messages.js?v=11.8"]),
      })
      .when("/messaging/message", {
        templateUrl: "/messaging/message/",
        controller: "messageCtrl",
        resolve: loader(["messaging/js/message.js?v=11.8"]),
      })
      .when("/task/tasks/", {
        templateUrl: "/task/tasks/",
      })
      .when("/task/crm/", {
        templateUrl: "/task/crm/",
      })
      .when("/accounts/company", {
        name: "company",
        templateUrl: "/accounts/company/",
        controller: "companyCtrl",
        resolve: loader(["accounts/js/company.js?v=13.6"]),
      })
      .when("/sysparameters", {
        templateUrl: "/b/sysparameters/",
        controller: "sysparametersCtrl",
        resolve: loader(["base/js/sysparameters.js?v=12.3"]),
      })
      .when("/sysparameter/:id", {
        name: "systemparameter",
        templateUrl: function (urlattr) {
          return "/b/sysparameter/" + urlattr.id + "/";
        },
        controller: "sysparameterseditCtrl",
        resolve: loader(["base/js/sysparameter.js?v=12.0"]),
      })
      .when("/b/sysparameter/:id", {
        name: "systemparameter",
        templateUrl: function (urlattr) {
          return "/b/sysparameter/" + urlattr.id + "/";
        },
        controller: "sysparameterseditCtrl",
        resolve: loader(["base/js/sysparameter.js?v=12.0"]),
      })
      .when("/accounts/roles", {
        templateUrl: "/accounts/roles/",
        controller: "rolesCtrl",
        resolve: loader(["accounts/js/roles.js?v=12.4"]),
      })
      .when("/accounts/role/:id", {
        name: "role",
        templateUrl: function (urlattr) {
          return "/accounts/role/" + urlattr.id + "/";
        },
        controller: "roleCtrl",
        resolve: loader(["accounts/js/role.js?v=12.7"]),
      })
      .when("/mails/test_mail/", {
        templateUrl: "/mails/test_mail/",
      })
      .when("/sales/customers", {
        templateUrl: "/sales/customers/",
        controller: "customersCtrl",
        resolve: loader(["sales/js/customers.js?v=1.2",
          "sales/js/customer_login_validation.js?v=0.1"
        ]),
      })
      .when("/sales/customer/:edit_customer_from/:id", {
        templateUrl: function (urlattr) {
          return "/sales/customer/" + urlattr.edit_customer_from + "/" + urlattr.id + "/";
        },
        controller: "customerCtrl",
        resolve: loader(["sales/js/customer.js?v=2.4"]),
      })
      .when("/sales/orders", {
        templateUrl: "/sales/orders/",
        controller: "ordersCtrl",
        resolve: loader(["sales/js/orders.js?v=1.3",
          "sales/js/customer_login_validation.js?v=0.1"
        ]),
      })
      // .when("/sales/inquiries", {
      //   templateUrl: "/sales/inquiries/",
      //   controller: "inquiriesCtrl",
      //   resolve: loader(["sales/js/inquiries.js?v=1.1"]),
      // })
      .when("/finance/invoices", {
        templateUrl: "/finance/invoices/",
        controller: "invoicesCtrl",
        resolve: loader([
          "finance/js/invoices.js?v=2.6",
          "finance/js/credit_limit.js?v=0.6",
          "finance/js/invoice_history.js?v=0.1",
          "finance/js/credit_report.js?v=0.1",
          "sales/js/customer_login_validation.js?v=0.1"
        ]),
      })
      .when("/finance/invoices/:customer_name", {
        name: "invoices",
        templateUrl: function (urlattr) {
          return "/finance/invoices/" + urlattr.customer_name + "/";
        },
        controller: "invoicesCtrl",
        resolve: loader(["finance/js/invoices.js?v=2.6"]),
      })
      .when("/finance/proforma_invoices", {
        templateUrl: "/finance/proforma_invoices/",
        controller: "proformaInvoicesCtrl",
        resolve: loader([
          "finance/js/proforma_invoices.js?v=1.6",
          "finance/js/credit_limit.js?v=0.6",
          "finance/js/invoice_history.js?v=0.1",
          "finance/js/credit_report.js?v=0.1",
        ]),
      })
      .when("/finance/proforma_invoices/:customer_name", {
        name: "proforma_invoices",
        templateUrl: function (urlattr) {
          return "/finance/proforma_invoices/" + urlattr.customer_name + "/";
        },
        controller: "proformaInvoicesCtrl",
        resolve: loader(["finance/js/proforma_invoices.js?v=1.6"]),
      })
      .when("/finance/payment_browser", {
        templateUrl: "/finance/payment_browser/",
        controller: "paymentBrowserCtrl",
        resolve: loader(["finance/js/payment_browser.js?v=1.3",
          "finance/js/invoice_history.js?v=0.1",
          "sales/js/customer_login_validation.js?v=0.1"
        ]),
      })
      .when("/finance/payment_unmatched", {
        templateUrl: "/finance/payment_browser_unmatched/",
        controller: "paymentBrowserUnmatchedCtrl",
        resolve: loader(["finance/js/payment_browser_unmatched.js?v=1.1"]),
      })
      .when("/sales/new_customers", {
        templateUrl: "/sales/new_customers/",
        controller: "newCustomersCtrl",
        resolve: loader(["sales/js/new_customers.js?v=0.1", "finance/js/credit_limit.js?v=0.6"]),
      })
      .when('/datafox/datafoxes/', {
        templateUrl: '/datafox/datafoxes',
        controller: 'articlesCtrl',
        resolve: loader(['datafox/js/articles.js?v=0.4']),
      })
      .when('/datafox/article/:id', {
        name: 'article',
        templateUrl: function (urlattr) {
          return '/datafox/article/' + urlattr.id + '/';
        },
        controller: 'articleCtrl',
        resolve: loader(['datafox/js/article.js?v=0.9']),
      })
      .when('/admin/settings', {
        templateUrl: '/base/settings/',
        controller: 'settingsCtrl',
      })
      .when('/sales/dashboard/', {
        templateUrl: '/sales/dashboard/',
        controller: 'salesdashboardCtrl',
        resolve: loader(['sales/js/dashboard.js?v=0.2']),
      })
      .when('/sales/titles', {
        templateUrl: '/sales/titles/',
        controller: 'titlesCtrl',
        resolve: loader(['sales/js/titles.js?v=0.4', 'sales/js/title.js?v=0.2',]),
      })
      .when('/sales/sources', {
        templateUrl: '/sales/sources/',
        controller: 'sourcesCtrl',
        resolve: loader(['sales/js/sources.js?v=0.1', 'sales/js/source.js?v=0.1',]),
      })
      .when('/sales/departments', {
        templateUrl: '/sales/departments/',
        controller: 'departmentsCtrl',
        resolve: loader(['sales/js/departments.js?v=0.1', 'sales/js/department.js?v=0.1',]),
      })
      .when('/sales/team_responsibles', {
        templateUrl: '/sales/team_responsibles/',
        controller: 'team_responsiblesCtrl',
        resolve: loader(['sales/js/team_responsibles.js?v=0.1', 'sales/js/team_responsible.js?v=0.1',]),
      })
      .when('/sales/pipelines/', {
        name: 'pipelines',
        templateUrl: '/sales/pipelines/',
        controller: 'PipelinesAndStagesCtrl',
        resolve: loader(['sales/js/pipelines.js?v=0.7']),
      })
      .when('/sales/pipeline/:id/', {
        name: 'pipeline',
        templateUrl: function (urlattr) {
          return '/sales/pipeline/' + urlattr.id + '/';
        },
        controller: 'pipelineCtrl',
        resolve: loader(['sales/js/pipeline.js?v=0.7']),
      })
      .when("/sales/tasks/", {
        templateUrl: function (urlattr) {
          return "/sales/tasks/" + urlattr.state + "/";
        },
        controller: "tasksCtrl",
        reloadOnSearch: false,
        resolve: loader(['sales/js/tasks.js?v=0.4']),
      })
      .when("/sales/task/:id/", {
        name: "task",
        templateUrl: function (urlattr) { return "/sales/task/" + urlattr.id + "/"; },
        controller: "taskCtrl",
        resolve: loader(["sales/js/task.js?v=0.5"]),
      })
      .when("/sales/holidays/", {
        templateUrl: "/sales/holidays/",
        controller: "holidaysCtrl",
        resolve: loader(["sales/js/holidays.js?v=1.2"]),
      })
      .when("/sales/contacts/", {
        templateUrl: "/sales/contacts/",
        controller: "contactsCtrl",
        resolve: loader(["sales/js/contacts.js?v=1.2"]),
      })
      .when("/sales/contact/:id/", {
        name: "contact",
        templateUrl: function (urlattr) { return "/sales/contact/" + urlattr.id + "/"; },
        controller: "contactCtrl",
        resolve: loader(["sales/js/contact.js?v=1.2"]),
      })
      .when('/sales/leads/', {
        templateUrl: '/sales/leads/',
        controller: 'leadsController',
        resolve: loader(['sales/js/leads.js?v=1.9']),
      })
      .when('/sales/lead/:id/', {
        name: 'lead',
        templateUrl: function (urlattr) { return '/sales/lead/' + urlattr.id + '/'; },
        controller: 'leadCtrl',
        resolve: loader(['sales/js/lead.js?v=1.9']),
      })
      .when("/sales/escalations/", {
        templateUrl: function (urlattr) {
          return "/sales/escalations/" + urlattr.state + "/";
        },
        controller: "escalationsCtrl",
        reloadOnSearch: false,
        resolve: loader(['sales/js/escalations.js?v=0.4']),
      })
      .when("/sales/escalation/:id/", {
        name: "escalation",
        templateUrl: function (urlattr) { return "/sales/escalation/" + urlattr.id + "/"; },
        controller: "escalationCtrl",
        resolve: loader(["sales/js/escalation.js?v=0.7"]),
      })
      .when("/sales/internal_requests/", {
        templateUrl: function (urlattr) {
          return "/sales/internal_requests/" + urlattr.state + "/";
        },
        controller: "internalRequestsCtrl",
        reloadOnSearch: false,
        resolve: loader(['sales/js/internal_requests.js?v=0.4']),
      })
      .when("/sales/internal_request/:id/", {
        name: "internal_request",
        templateUrl: function (urlattr) { return "/sales/internal_request/" + urlattr.id + "/"; },
        controller: "internalRequestCtrl",
        resolve: loader(["sales/js/internal_request.js?v=0.6"]),
      })
      .when("/sales/inquiries/", {
        templateUrl: function (urlattr) {
          return "/sales/inquiries/" + urlattr.state + "/";
        },
        controller: "inquiriesCtrl",
        reloadOnSearch: false,
        resolve: loader(['sales/js/inquiries.js?v=0.3']),
      })
      .when("/sales/inquiry/:id/", {
        name: "inquiry",
        templateUrl: function (urlattr) { return "/sales/inquiry/" + urlattr.id + "/"; },
        controller: "inquiryCtrl",
        resolve: loader(["sales/js/inquiry.js?v=0.2"]),
      })
      .when("/sales/reports/:id", {
        name: "reports",
        templateUrl: function (urlattr) {
          $("#loading-image").show();
          return "/sales/reports/" + urlattr.id + "/";
        },
        controller: "reportsCtrl",
        resolve: loader(["sales/js/report.js?v=14.8"]),
      })
      .when("/sales/model_reports/", {
        templateUrl: "/sales/model_reports/",
        controller: "modelReportsCtrl",
        resolve: loader(["sales/js/model_reports.js?v=0.12"]),
      })
      .when("/sales/report_deal_won/:service_name", {
        name: "report_deal_won",
        templateUrl: function (urlattr) {
          $("#loading-image").show();
          return "/sales/report_deal_won/" + urlattr.service_name + "/";
        },
        controller: "report_deal_wonCtrl",
        resolve: loader(["sales/js/report_deal_won.js?v=14.9"]),
      })
      .when("/sales/sales_persons/", {
        templateUrl: "/sales/sales_persons/",
        controller: "salesPersonsCtrl",
        resolve: loader(["sales/js/sales_persons.js?v=0.3"]),
      })
      .when("/sales/sales_person/:id", {
        name: "sales_person",
        templateUrl: function (urlattr) {
          return "/sales/sales_person/" + urlattr.id + "/";
        },
        controller: "salesPersonCtrl",
        resolve: loader(["sales/js/sales_person.js?v=0.4"]),
      })
      .when("/sales/deals/", {
        name: "deals",
        templateUrl: function (urlattr) {
          return "/sales/deals/" + urlattr.types + "/";
        },
        controller: "dealsCtrl",
        resolve: loader(['sales/js/deals.js?v=0.14']),
      })
      .when("/sales/deal/:id/", {
        name: "deal",
        templateUrl: function (urlattr) { return "/sales/deal/" + urlattr.id + "/"; },
        controller: "dealCtrl",
        reloadOnSearch: false,
        resolve: loader(['sales/js/deal.js?v=0.9']),
      })
      .when('/sales/deal_dashboard', {
        templateUrl: '/sales/deal_dashboard/',
        controller: 'deal_dashboardCtrl',
        resolve: loader(['sales/js/deal_dashboard.js?v=0.3']),
      })
      .when('/sales/lead_reasons', {
        templateUrl: '/sales/lead_reasons/',
        controller: 'lead_reasonsCtrl',
        resolve: loader(['sales/js/lead_reasons.js?v=0.2', 'sales/js/lead_reason.js?v=0.2',]),
      })
      .when('/sales/deal_reasons', {
        templateUrl: '/sales/deal_reasons/',
        controller: 'deal_reasonsCtrl',
        resolve: loader(['sales/js/deal_reasons.js?v=0.2', 'sales/js/deal_reason.js?v=0.2',]),
      })
      .when('/sales/cities', {
        templateUrl: '/sales/cities/',
        controller: 'citiesCtrl',
        resolve: loader(['sales/js/cities.js?v=0.3', 'sales/js/city.js?v=0.4',]),
      })
      .when("/sales/visits/", {
        name: "visits",
        templateUrl: "/sales/visits/",
        controller: "visitsCtrl",
        resolve: loader(["sales/js/visits.js?v=0.4"]),
      })
      .when("/sales/visit/:id/", {
        name: "visit",
        templateUrl: function (urlattr) {
          return "/sales/visit/" + urlattr.id + "/";
        },
        controller: "visitCtrl",
        resolve: loader(["sales/js/visit.js?v=0.6"]),
      })
      .when("/accounts/allowed_ip", {
        templateUrl: "/accounts/whitelist_ips/",
        controller: "allowedipCtrl",
        resolve: loader(["accounts/js/whitelisting_ip.js?v=0.6"]),
      })
      .when('/datafox/zoho_campaign_api', {
        templateUrl: '/datafox/zoho_campaign_api/',
        controller: 'zoho_campaign_apiCtrl',
        resolve: loader(['datafox/js/zoho_campaign_api.js?v=0.0',]),
      })
      .when('/sales/follow_up_status_list', {
        templateUrl: '/sales/follow_up_status_list/',
        controller: 'follow_up_status_listCtrl',
        resolve: loader(['sales/js/follow_up_status.js?v=0.1', 'sales/js/follow_up_status_list.js?v=0.1',]),
      })
      .when('/sales/checklists', {
        templateUrl: '/sales/checklists/',
        controller: 'checklistsCtrl',
        resolve: loader(['sales/js/checklists.js?v=0.3', 'sales/js/checklist.js?v=0.2',]),
      })
      .when("/sales/corrective_action_reports/", {
        templateUrl: function (urlattr) {
          return "/sales/corrective_action_reports/" + urlattr.state + "/";
        },
        controller: "CorrectiveactionreportsCtrl",
        reloadOnSearch: false,
        resolve: loader(['sales/js/corrective_action_reports.js?v=0.2']),
      })
      .when("/sales/corrective_action_report/:id/", {
        name: "corrective_action_report",
        templateUrl: function (urlattr) { return "/sales/corrective_action_report/" + urlattr.id + "/"; },
        controller: "CorrectiveactionreportCtrl",
        resolve: loader(["sales/js/corrective_action_report.js?v=0.3"]),
      })
      .when('/sales/team_member_names', {
        templateUrl: '/sales/team_member_names/',
        controller: 'team_member_namesCtrl',
        resolve: loader(['sales/js/team_member_names.js?v=0.1', 'sales/js/team_member_name.js?v=0.1',]),
      })
      .when('/datafox/blogs', {
        templateUrl: '/datafox/blogs/',
        controller: 'blogsCtrl',
        resolve: loader(['datafox/js/blogs.js?v=0.1']),
      })
      .when("/datafox/blog/:id/", {
        name: "blog",
        templateUrl: function (urlattr) {
          return "/datafox/blog/" + urlattr.id + "/";
        },
        controller: "blogCtrl",
        resolve: loader(["datafox/js/blog.js?v=0.1"]),
      })
      .when('/sales/reminders', {
        templateUrl: '/sales/reminders/',
        controller: 'remindersCtrl',
        resolve: loader(['sales/js/reminders.js?v=0.2', 'sales/js/reminder.js?v=0.1',]),
      })
      .when('/sales/approval_rules/', {
        templateUrl: '/sales/approval_rules/',
        controller: 'approvalRulesCtrl',
        resolve: loader(['sales/js/approval_rules.js?v=0.1']),
      });
  },
]);
