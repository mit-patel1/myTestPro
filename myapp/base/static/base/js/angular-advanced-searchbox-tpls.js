
(function () {
    'use strict';

    angular
        .module('angular-advanced-searchbox', [])
        .directive('nitAdvancedSearchbox', function () {
            return {
                restrict: 'E',
                scope: {
                    model: '=ngModel',
                    parameters: '=',
                    parametersLabel: '@',
                    parametersDisplayLimit: '=?',
                    placeholder: '@',
                    searchThrottleTime: '=?',
                    index: '@',
                    cacheParam: '@',
                },
                replace: true,
                templateUrl: function (element, attr) {
                    return attr.templateUrl || 'angular-advanced-searchbox.html';
                },
                controller: [
                    '$scope',
                    '$attrs',
                    '$element',
                    '$timeout',
                    '$filter',
                    function ($scope, $attrs, $element, $timeout, $filter) {
                        $scope.cacheParam = $scope.cacheParam || 'true';

                        $scope.parametersLabel = $scope.parametersLabel || 'Select parameter(s)';
                        $scope.parametersDisplayLimit = $scope.parametersDisplayLimit || 8;
                        $scope.placeholder = $scope.placeholder || 'Search ...';
                        $scope.searchThrottleTime = $scope.searchThrottleTime || 1000;
                        $scope.searchParameterName = [];
                        $scope.filterParameter = [];
                        $scope.searchParams = [];
                        $scope.searchQuery = '';
                        $scope.defaultparams = {};

                        $scope.option = '';
                        $scope.setSearchFocus = false;
                        var searchThrottleTimer;
                        var changeBuffer = [];

                        for (var x = 0; x < $scope.parameters.length; x++) {
                            var copyParam = $.extend(true, {}, $scope.parameters[x]);
                            if (copyParam['type'] != 'list' && copyParam['type'] != 'datePicker') {
                                $scope.searchParameterName.push(copyParam);
                            }
                            $scope.filterParameter.push(copyParam);
                            if("default_val" in copyParam){
                                $scope.defaultparams[copyParam["key"]] = copyParam["default_val"]
                            }
                        }

                        $scope.parameters = $scope.parameters.filter(function (obj) {
                            return obj.type != 'datePicker' && obj.type != 'list';
                        });
                        if ($scope.defaultparams) {
                          if (!$scope.defaultparams.query) {
                             $scope.defaultparams.query = '';
                            }
                        }

                    $scope.model = angular.copy($scope.defaultparams);
                    $scope.$watch('defaultparams', function () {
                       $scope.model = angular.copy($scope.defaultparams);
                    });

                        $scope.$watch(
                            'model',
                            function (newValue, oldValue) {
                                if (angular.equals(newValue, oldValue)) return;

                                angular.forEach($scope.model, function (value, key) {
                                    if (key === 'query' && $scope.searchQuery !== value) {
                                        $scope.searchQuery = value;
                                    } else {
                                        var paramTemplate = $filter('filter')($scope.parameters, function (param) {
                                            return param.key === key;
                                        })[0];
                                        var searchParam = $filter('filter')($scope.searchParams, function (param) {
                                            return param.key === key;
                                        })[0];
                                        if (paramTemplate !== undefined) {
                                            if (searchParam === undefined) $scope.addSearchParam(paramTemplate, value, false);
                                            else if (searchParam.value !== value) searchParam.value = value;
                                        }
                                    }
                                });

                                // delete not existing search parameters from internal state array
                                angular.forEach($scope.searchParams, function (value, key) {
                                    if (!$scope.model.hasOwnProperty(value.key)) {
                                        var index = $scope.searchParams
                                            .map(function (e) {
                                                return e.key;
                                            })
                                            .indexOf(value.key);
                                        $scope.removeSearchParam(index);
                                    }
                                });
                            },
                            true
                        );

                        $scope.searchParamValueChanged = function (param) {
                            updateModel('change', param.key, param.value);
                            if (param.type == 'list') {
                                var e = jQuery.Event('keydown');
                                e.which = 13; // # key code value for Enter
                                e.key = 'Enter';
                                var newindex = $scope.searchParams
                                    .map(function (o) {
                                        return o.key;
                                    })
                                    .indexOf(param.key);
                                $scope.keydown(e, newindex);
                            }
                        };

                        $scope.searchQueryChanged = function (query) {
                            // updateModel('change', 'query', query);
                        };

                        $scope.enterEditMode = function (e, index) {
                            if (e !== undefined) e.stopPropagation();

                            if (index === undefined) return;

                            var searchParam = $scope.searchParams[index];
                            searchParam.editMode = true;
                            $scope.$emit('advanced-searchbox:enteredEditMode', searchParam, $scope.index, $scope.cacheParam);
                        };

                        $scope.leaveEditMode = function (e, index) {
                            if (index === undefined) return;
                            var searchParam = $scope.searchParams[index];
                            searchParam.editMode = false;
                            $scope.$emit('advanced-searchbox:leavedEditMode', searchParam, $scope.index, $scope.cacheParam);

                            // remove empty search params
                            if (!searchParam.value) $scope.removeSearchParam(index);
                        };

                        $scope.searchQueryTypeaheadOnSelect = function (event, item, model, label) {
                            var wrapper = document.createElement('DIV');
                            wrapper.innerHTML = label;
                            var searchValue = $(wrapper).find('b').text().trim();

                            item.name = $($(label)[2]).text();
                            $scope.addSearchParam(item, searchValue, false, true);
                            $scope.searchQuery = '';
                            updateModel('delete', 'query');
                        };

                        $scope.searchQueryOnSelect = function (event, item, model, label) {
                            var searchValue = '';
                            $scope.addSearchParam(item, searchValue, true, false);
                            $scope.searchQuery = '';
                            updateModel('delete', 'query');
                        };

                        $scope.searchParamTypeaheadOnSelect = function (suggestedValue, searchParam) {
                            searchParam.value = suggestedValue;
                            $scope.searchParamValueChanged(searchParam);
                        };

                        $scope.isUnsedParameter = function (value, index) {
                            return (
                                $filter('filter')($scope.searchParams, function (param) {
                                    return param.key === value.key;
                                }).length === 0
                            );
                        };

                        $scope.addSearchParam = function (searchParam, value, enterEditModel, directEnter) {
                            if (enterEditModel === undefined) enterEditModel = true;

                            if (searchParam.type == 'list') {
                                enterEditModel = true;
                            }

                            if (!$scope.isUnsedParameter(searchParam)) return;

                            var newIndex =
                                $scope.searchParams.push({
                                    key: searchParam.key,
                                    name: searchParam.name,
                                    type: searchParam.type || 'text',
                                    placeholder: searchParam.placeholder,
                                    options: searchParam.options || [],
                                    restrictToSuggestedValues: searchParam.restrictToSuggestedValues || false,
                                    value: value || '',
                                }) - 1;
                            updateModel('add', searchParam.key, value);

                            if (directEnter === true) {
                                $scope.leaveEditMode(undefined, newIndex);
                            }

                            // //Applied date picker
                            $timeout(function () {
                                var startDate = moment();
                                var endDate = moment();
                                var inputValue = $($('div').find('[data-key=' + searchParam.key + ']')[0])
                                    .next()
                                    .find('input')[0];
                                if ($(inputValue).attr('type') == 'datePicker') {
                                    $(inputValue)
                                        .daterangepicker(
                                            {
                                                startDate: startDate,
                                                endDate: endDate,
                                                locale: {
                                                    format: 'DD/MM/YYYY',
                                                },
                                                ranges: {
                                                    Today: [moment(), moment()],
                                                    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                                                    'Last Week': [moment().subtract(1, 'weeks').startOf('week').format('DD-MM-YYYY'), moment().subtract(1, 'weeks').endOf('week').format('DD-MM-YYYY')],
                                                    'Last 7 Days': [moment().subtract(7, 'days'), moment().subtract(1, 'days')],
                                                    'Last 30 Days': [moment().subtract(30, 'days'), moment().subtract(1, 'days')],
                                                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                                                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                                                    'This Year': [moment().startOf('year'), moment().endOf('year')],
                                                    'Last Year': [moment().subtract(1, 'year').add(1, 'day'), moment()],
                                                },
                                            },
                                            function (start, end) {
                                                var e = jQuery.Event('keydown');
                                                e.which = 13; // # key code value for Enter
                                                e.key = 'Enter';
                                                $scope.searchParams[newIndex]['value'] = start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY');
                                                $scope.keydown(e, newIndex);
                                            }
                                        )
                                        .on('hide', function (e) {
                                            $scope.leaveEditMode(undefined, newIndex);
                                        });
                                } else if (directEnter === true) {
                                }
                            }, 0);

                            if (enterEditModel === true) {
                                $timeout(function () {
                                    $scope.enterEditMode(undefined, newIndex);
                                }, 100);
                            }

                            $scope.$emit('advanced-searchbox:addedSearchParam', searchParam);
                        };

                        $scope.removeSearchParam = function (index) {
                            if (index === undefined) return;

                            var searchParam = $scope.searchParams[index];
                            $scope.searchParams.splice(index, 1);

                            updateModel('delete', searchParam.key);

                            $scope.$emit('advanced-searchbox:removedSearchParam', searchParam, $scope.index, $scope.cacheParam);
                        };

                        $scope.removeAll = function () {
                            $scope.searchParams.length = 0;
                            $scope.searchQuery = '';

                            $scope.model = {};

                            $scope.$emit('advanced-searchbox:removedAllSearchParam', $scope.index, $scope.cacheParam);
                        };

                        $scope.editPrevious = function (currentIndex) {
                            if (currentIndex !== undefined) $scope.leaveEditMode(undefined, currentIndex);

                            //TODO: check if index == 0 -> what then?
                            if (currentIndex > 0) {
                                $scope.enterEditMode(undefined, currentIndex - 1);
                            } else if ($scope.searchParams.length > 0) {
                                $scope.enterEditMode(undefined, $scope.searchParams.length - 1);
                            }
                        };

                        $scope.editNext = function (currentIndex) {
                            if (currentIndex === undefined) return;

                            $scope.leaveEditMode(undefined, currentIndex);
                            //TODO: check if index == array length - 1 -> what then?
                            if (currentIndex < $scope.searchParams.length - 1) {
                                $scope.enterEditMode(undefined, currentIndex + 1);
                            } else {
                                $scope.setSearchFocus = true;
                            }

                            return false;
                        };

                        // $scope.hasReIndexed = false;
                        $scope.reIndexAppSearchParams = function (event, searchValue) {
                            if ($scope.index == 98) {
                                var isMO = /^mo/gi.test(searchValue);
                                var isPO = /^po/gi.test(searchValue);
                                var isSO = /^so/gi.test(searchValue);
                                var isTO = /^to/gi.test(searchValue);
                                var isINV = /^inv/gi.test(searchValue);
                                var isPP = /^pp/gi.test(searchValue);

                                var paramIndex = $scope.parameters.findIndex(function (parameter) {
                                    if (isMO) {
                                        return parameter.key == 'mfg_nr';
                                    } else if (isPO) {
                                        return parameter.key == 'po_nr';
                                    } else if (isSO) {
                                        return parameter.key == 'so_nr';
                                    } else if (isTO) {
                                        return parameter.key == 'to_nr';
                                    } else if (isINV) {
                                        return parameter.key == 'inv_nr';
                                    } else if (isPP) {
                                        return parameter.key == 'pp_nr';
                                    }
                                    return -1;
                                });

                                if (paramIndex != -1) {
                                    var tempSearchItemName = $scope.searchParameterName[0];
                                    $scope.searchParameterName[0] = $scope.searchParameterName[paramIndex];
                                    $scope.searchParameterName[paramIndex] = tempSearchItemName;

                                    var tempSearchItem = $scope.parameters[0];
                                    $scope.parameters[0] = $scope.parameters[paramIndex];
                                    $scope.parameters[paramIndex] = tempSearchItem;
                                    $scope.hasReIndexed = true;
                                }
                            }
                        };

                        $scope.paste = function (event) {
                            var pastedData = event.originalEvent.clipboardData.getData('text');
                            $scope.reIndexAppSearchParams('paste', pastedData);
                            for (var x = 0; x < $scope.searchParameterName.length; x++) {
                                $scope.parameters[x].name =
                                    '<span class="pref-srctxt">Search in</span> ' +
                                    ' <span class="srch-name">' +
                                    $scope.searchParameterName[x].name +
                                    '</span>: <b>' +
                                    pastedData +
                                    '</b>';
                            }
                        };

                        $scope.keydown = function (e, searchParamIndex) {
                            var handledKeys = [8, 9, 13, 37, 39];
                            if (e.which == 8 || e.key.length == 1) {
                                var keyword = $(e.target).val().trim();
                                //backspace
                                if (e.which == 8) {
                                    if (keyword.length != 0) {
                                        keyword = keyword.substring(0, keyword.length - 1);
                                    }
                                } else {
                                    keyword += e.key;
                                }

                                $scope.reIndexAppSearchParams('key', keyword);
                                for (var x = 0; x < $scope.searchParameterName.length; x++) {
                                    $scope.parameters[x].name =
                                        '<span class="pref-srctxt">Search in</span> ' +
                                        ' <span class="srch-name">' +
                                        $scope.searchParameterName[x].name +
                                        '</span>: <b>' +
                                        keyword +
                                        '</b>';
                                }
                            }

                            if (handledKeys.indexOf(e.which) === -1) return;

                            var cursorPosition = getCurrentCaretPosition(e.target);

                            if (e.which == 8) {
                                // backspace
                                if (cursorPosition === 0) {
                                    e.preventDefault();
                                    $scope.editPrevious(searchParamIndex);
                                }
                            } else if (e.which == 9) {
                                // tab
                                if (e.shiftKey) {
                                    e.preventDefault();
                                    $scope.editPrevious(searchParamIndex);
                                } else {
                                    e.preventDefault();
                                    $scope.editNext(searchParamIndex);
                                }
                            } else if (e.which == 13) {
                                // enter
                                e.stopPropagation();
                                $scope.editNext(searchParamIndex);
                            } else if (e.which == 37) {
                                // left
                                if (cursorPosition === 0) $scope.editPrevious(searchParamIndex);
                            } else if (e.which == 39) {
                                // right
                                if (cursorPosition === e.target.value.length) $scope.editNext(searchParamIndex);
                            }
                        };

                        function restoreModel() {
                            angular.forEach($scope.model, function (value, key) {
                                if (key === 'query') {
                                    $scope.searchQuery = value;
                                } else {
                                    var searchParam = $filter('filter')($scope.parameters, function (param) {
                                        return param.key === key;
                                    })[0];
                                    if (searchParam !== undefined) $scope.addSearchParam(searchParam, value, false);
                                }
                            });
                        }

                        if ($scope.model === undefined) {
                            $scope.model = {};
                        } else {
                            restoreModel();
                        }

                        function updateModel(command, key, value) {
                            if (searchThrottleTimer) $timeout.cancel(searchThrottleTimer);

                            // remove all previous entries to the same search key that was not handled yet
                            changeBuffer = $filter('filter')(changeBuffer, function (change) {
                                return change.key !== key;
                            });
                            // add new change to list
                            changeBuffer.push({
                                command: command,
                                key: key,
                                value: value,
                            });
                            searchThrottleTimer = $timeout(function () {
                                angular.forEach(changeBuffer, function (change) {
                                    if (change.command === 'delete') delete $scope.model[change.key];
                                    else $scope.model[change.key] = change.value;
                                });

                                changeBuffer.length = 0;

                                $scope.$emit('advanced-searchbox:modelUpdated', $scope.model);
                            }, $scope.searchThrottleTime);
                        }

                        function getCurrentCaretPosition(input) {
                            if (!input) return 0;

                            try {
                                // Firefox & co
                                if (typeof input.selectionStart === 'number') {
                                    return input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;
                                } else if (document.selection) {
                                    // IE
                                    input.focus();
                                    var selection = document.selection.createRange();
                                    var selectionLength = document.selection.createRange().text.length;
                                    selection.moveStart('character', -input.value.length);
                                    return selection.text.length - selectionLength;
                                }
                            } catch (err) {
                                // selectionStart is not supported by HTML 5 input type, so jut ignore it
                            }

                            return 0;
                        }
                    },
                ],
            };
        })
        .directive('nitSetFocus', [
            '$timeout',
            '$parse',
            function ($timeout, $parse) {
                return {
                    restrict: 'A',
                    link: function ($scope, $element, $attrs) {
                        var model = $parse($attrs.nitSetFocus);
                        $scope.$watch(model, function (value) {
                            if (value === true) {
                                $timeout(function () {
                                    $element[0].focus();
                                });
                            }
                        });
                        /*$element.bind('blur', function() {
                            $scope.$apply(model.assign($scope, false));
                        });*/
                    },
                };
            },
        ])
        .directive('nitAutoSizeInput', [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'A',
                    scope: {
                        model: '=ngModel',
                    },
                    link: function ($scope, $element, $attrs) {
                        var supportedInputTypes = ['text', 'search', 'tel', 'url', 'email', 'password', 'number'];

                        var container = angular.element('<div style="position: fixed; top: -9999px; left: 0px;"></div>');
                        var shadow = angular.element('<span style="white-space:pre;"></span>');

                        angular.forEach(
                            [
                                'fontSize',
                                'fontFamily',
                                'fontWeight',
                                'fontStyle',
                                'letterSpacing',
                                'textTransform',
                                'wordSpacing',
                                'textIndent',
                                'boxSizing',
                                'borderLeftWidth',
                                'borderRightWidth',
                                'borderLeftStyle',
                                'borderRightStyle',
                                'paddingLeft',
                                'paddingRight',
                                'marginLeft',
                                'marginRight',
                            ],
                            function (css) {
                                shadow.css(css, $element.css(css));
                            }
                        );

                        angular.element('body').append(container.append(shadow));

                        function resize() {
                            $timeout(function () {
                                if (supportedInputTypes.indexOf($element[0].type || 'text') === -1) return;

                                shadow.text($element.val() || $element.attr('placeholder'));
                                // $element.css('width', shadow.outerWidth() + 10);
                            });
                        }

                        resize();

                        if ($scope.model) {
                            $scope.$watch('model', function () {
                                resize();
                            });
                        } else {
                            $element.on('keypress keyup keydown focus input propertychange change', function () {
                                resize();
                            });
                        }
                    },
                };
            },
        ]);
})();

angular.module('angular-advanced-searchbox').run([
    '$templateCache',
    function ($templateCache) {
        'use strict';

        /*
      Edited: By priyank
      Change: Removed blur event from template. Because of it leavedEditMode calls twice.
     */
        $templateCache.put(
            'angular-advanced-searchbox.html',
            '<div class=advancedSearchBox ng-class={active:focus} ng-init="focus = false" ng-click="!focus ? setSearchFocus = true : null">' +
                '<span><i ng-show="filterParameter.length > 0" class="search-icon glyphicon glyphicon-filter"  title="Apply filter" style = "cursor:pointer;color:#636363" data-toggle="dropdown"></i>' +
                '<ul id = "dropdownMenuRight" class="dropdown-menu dropdown-menu-org dropdown-menu-right" style="width:36%">' +
                '<li ng-repeat="param in filterParameter"><a ng-click="searchQueryOnSelect($event, param, $model, $label)">{{param.name}}<i ng-if="param.type == \'datePicker\'" style = "margin-left:10px;margin-bottom:3px;" class="glyphicon glyphicon-calendar fa fa-calendar"></i></a></li>' +
                '</ul></span>' +
                '<a ng-href="" ng-show="searchParams.length > 0 || searchQuery.length > 0" ng-click=removeAll() role=button><span class="remove-all-icon glyphicon glyphicon-trash"></span></a><div>' +
                '<div class=\'search-parameter search-param-front\' ng-repeat="searchParam in searchParams">' +
                '<a ng-href="" ng-click=removeSearchParam($index) role=button><span class="remove glyphicon glyphicon-trash"></span></a>' +
                '<div class=key data-key={{searchParam.key}} ng-click="enterEditMode($event, $index)">{{searchParam.name}}:</div>' +
                '<div class=value ng-if="searchParam.type != \'list\'"><span ng-show=!searchParam.editMode ng-click="enterEditMode($event, $index)">{{searchParam.value}}</span>' +
                '<input name=value type={{searchParam.type}} nit-auto-size-input nit-set-focus=searchParam.editMode ng-keydown="keydown($event, $index)"  ng-show=searchParam.editMode ng-change="searchParam.restrictToSuggestedValues !== true ? searchParamValueChanged(searchParam) : null" ng-model=searchParam.value uib-typeahead= "suggestedValue for suggestedValue in searchParam.suggestedValues | filter:$viewValue" typeahead-min-length=0 typeahead-on-select="searchParamTypeaheadOnSelect($item, searchParam)" typeahead-editable="searchParam.restrictToSuggestedValues !== true" typeahead-select-on-exact=true typeahead-select-on-blur="searchParam.restrictToSuggestedValues !== true ? false : true" placeholder="{{searchParam.placeholder}}">' +
                '</div><div class=value ng-if="searchParam.type == \'list\'"><span ng-show=!searchParam.editMode ng-click="enterEditMode($event, $index)">{{searchParam.value}}</span>' +
                '<select nit-auto-size-input nit-set-focus=searchParam.editMode ng-keydown="keydown($event, $index)"  ng-show=searchParam.editMode   ng-model=searchParam.value ng-change=searchParamValueChanged(searchParam) ng-options="param for param in searchParam.options" ></select></div>' +
                '</div><div class=\'input-div\'><input name=searchbox id=search class=search-parameter-input nit-auto-size-input nit-set-focus=setSearchFocus ng-paste=paste($event) ng-keydown=keydown($event) placeholder={{placeholder}} ng-focus="focus = true" ng-blur="focus = false" uib-typeahead=" parameter as parameter.name for parameter in parameters | filter:isUnsedParameter | limitTo:parametersDisplayLimit" typeahead-on-select="searchQueryTypeaheadOnSelect($event, $item, $model, $label)" ng-change=searchQueryChanged(searchQuery) ng-model="searchQuery"></div></div>'
        );
    },
]);
