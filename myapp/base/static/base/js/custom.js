/**
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var URL = window.location.href.split('?')[0],
    $BODY = $('.main-body');
    $MENU_TOGGLE = $('#menu_toggle');
    $HEADER_MENU_TOGGLE = $('#header_menu_toggle');
    $SIDEBAR_MENU = $('#sidebar-menu');
    $SIDEBAR_FOOTER = $('.sidebar-footer');
    $LEFT_COL = $('.left_col');
    $RIGHT_COL = $('.right_col');
    $NAV_MENU = $('.nav_menu');
    $FOOTER = $('footer');
    $APP_CONTAINER = $('#app_container');
    $MODAL_BODY = $('.modal-body');

// Sidebar
$(document).ready(function() {
    // TODO: This is some kind of easy fix, maybe we can improve this
    var setContentHeight = function () {
        // reset height
        $RIGHT_COL.css('min-height', $(window).height());

        var bodyHeight = $BODY.height(),
            leftColHeight = $LEFT_COL.eq(1).height() + $SIDEBAR_FOOTER.height(),
            contentHeight = bodyHeight < leftColHeight ? leftColHeight : bodyHeight;

        // normalize content
        contentHeight -= $NAV_MENU.height() + $FOOTER.height();
        appcontainerHeight = $(window).height() - ($('.nav_menu').outerHeight() + 60);
        if(sparrow.inIframe()) {
            appcontainerHeight = appcontainerHeight + 45;
          }
        $RIGHT_COL.css('min-height', contentHeight+50+'px');
        if($('.details-footer').length != 0) {
            $('.details-body').css({
                "height": appcontainerHeight - ($('.details-footer').height() + 30) + "px",
                "overflow": "auto" 
            })
        }
        $APP_CONTAINER.css({
          "max-height": appcontainerHeight + 25 + "px",
          "height": appcontainerHeight + 25 + "px",
          "overflow": "auto" 
        })
        if($('.scroll-body').length > 0) {
            var height = $(window).height() - ($('.nav_menu').outerHeight() + 205);
            if($('.dataTables_scrollBody').attr('footer') != undefined) {
                var footerHeight = 0
                $.each($('.'+$('.dataTables_scrollBody').attr('footer')), function() {
                  footerHeight += $(this)[0].offsetHeight - 25;
                });
                height = height - footerHeight;
            }
            $('.dataTables_scrollBody').css('max-height',height +'px');
        }

        $BODY.css('overflow','hidden');
    };

    $SIDEBAR_MENU.find('a').on('click', function(ev) {
        var $li = $(this).parent();

        if ($li.is('.active')) {
            $li.removeClass('active');
            $('ul:first', $li).slideUp(function() {
                setContentHeight();
            });
        } else {
            // prevent closing menu if we are on child menu
            if (!$li.parent().is('.child_menu')) {
                $SIDEBAR_MENU.find('li').removeClass('active');
                $SIDEBAR_MENU.find('li ul').slideUp();
            } else {
                $li.parent().find('li').removeClass('active').removeClass('current-page');
            }
            
            $li.addClass('active');

            $('ul:first', $li).slideDown(function() {
                setContentHeight();
            });
        }
    });

    defaultView = sparrow.getCookie('LeftSideMenuView');
    if (defaultView == 'icon_only') {
        $('.toggle_menu').hide();
        $('#leftmenu').attr('style', 'max-width:74px;height:100%;overflow-x: hidden;overflow-y: auto;');
        $('.drawer-icon-menu2').show();
        $BODY.removeClass('nav-md').addClass('nav-sm nav-extra');
        $HEADER_MENU_TOGGLE.show();
        $('.dataTables_scrollHeadInner').css('width', 'auto');

        if ($SIDEBAR_MENU.find('li').hasClass('active')) {
            $SIDEBAR_MENU.find('li.active').find('ul.nav').css('display', 'none');
            $SIDEBAR_MENU.find('li.active').addClass('active-sm').removeClass('active');
        }
        setContentHeight();
    }
    if (defaultView == 'icon_with_text') {
        $('.toggle_menu').show();
        $('#leftmenu').attr('style', 'max-width:230px;height:100%;overflow-x: hidden;overflow-y: auto;');
        $('#sidebar-menu').attr('style', 'display:block');
        $BODY.attr('style', 'margin-left: 0px');
        $('.dataTables_scrollHeadInner').css('width', 'auto');
        $BODY.removeClass('nav-sm nav-extra').addClass('nav-md');
        $HEADER_MENU_TOGGLE.hide();

        if ($SIDEBAR_MENU.find('li').hasClass('active-sm')) {
            $SIDEBAR_MENU.find('li.active-sm').find('ul.nav').css('display', 'block');
            $SIDEBAR_MENU.find('li.active-sm').addClass('active').removeClass('active-sm');
        }
        setContentHeight();
    }

    // toggle small or large menu
    $MENU_TOGGLE.on('click', function() {
        if ($BODY.hasClass('nav-md')) {
            sparrow.setCookie('LeftSideMenuView', 'icon_only');
            $('.toggle_menu').hide();
            $('#leftmenu').attr('style', '--max-width:74px;height:100%;overflow-x: hidden;overflow-y: auto;');
            $('.drawer-icon-menu2').show();
            $BODY.removeClass('nav-md').addClass('nav-sm nav-extra');
            $HEADER_MENU_TOGGLE.show();
            $('.dataTables_scrollHeadInner').css('width', 'auto');

            if ($SIDEBAR_MENU.find('li').hasClass('active')) {
                $SIDEBAR_MENU.find('li.active').find('ul.nav').css('display','none');
                $SIDEBAR_MENU.find('li.active').addClass('active-sm').removeClass('active');
            }
         }
        setContentHeight();
    });

    $HEADER_MENU_TOGGLE.on('click', function () {
        sparrow.setCookie('LeftSideMenuView', 'icon_with_text');
        if ($BODY.hasClass('nav-sm')) {
            $('.toggle_menu').show();
            $('#leftmenu').attr('style', 'max-width:230px;height:100%;overflow-x: hidden;overflow-y: auto;');
            $('#sidebar-menu').attr('style', 'display:block');
            $BODY.attr('style', 'margin-left: 0px');
            $('.dataTables_scrollHeadInner').css('width', 'auto');
            $BODY.removeClass('nav-sm nav-extra').addClass('nav-md');
            $HEADER_MENU_TOGGLE.hide();

            if ($SIDEBAR_MENU.find('li').hasClass('active-sm')) {
                $SIDEBAR_MENU.find('li.active-sm').find('ul.nav').css('display', 'block');
                $SIDEBAR_MENU.find('li.active-sm').addClass('active').removeClass('active-sm');
            }
        }
        setContentHeight();
    });
    $SIDEBAR_MENU.mouseenter(function () {
        if ($BODY.hasClass('nav-sm')) {
            $('.toggle_menu').show();
            $('#leftmenu').attr('style', 'max-width:230px;height:100%;overflow-x: hidden;overflow-y: auto;');
            $('#sidebar-menu').attr('style', 'display:block;');
            $BODY.attr('style', 'margin-left: 0px');
            $('.dataTables_scrollHeadInner').css('width', 'auto');
            $BODY.removeClass('nav-sm').addClass('nav-md');
            $HEADER_MENU_TOGGLE.hide();
            if ($SIDEBAR_MENU.find('li').hasClass('active-sm')) {
                $SIDEBAR_MENU.find('li.active-sm').find('ul.nav').css('display', 'block');
                $SIDEBAR_MENU.find('li.active-sm').addClass('active').removeClass('active-sm');
            }
            setContentHeight();
        }
    });
    $SIDEBAR_MENU.mouseleave(function () {
        if ($BODY.hasClass('nav-extra')) {
            $('.toggle_menu').hide();
            $('#leftmenu').attr('style', 'max-width:74px;height:100%;overflow-x: hidden;overflow-y: auto;');
            $('.drawer-icon-menu2').show();
            $BODY.removeClass('nav-md').addClass('nav-sm');
            $HEADER_MENU_TOGGLE.show();
            $('.dataTables_scrollHeadInner').css('width', 'auto');

            if ($SIDEBAR_MENU.find('li').hasClass('active')) {
                $SIDEBAR_MENU.find('li.active').find('ul.nav').css('display', 'none');
                $SIDEBAR_MENU.find('li.active').addClass('active-sm').removeClass('active');
            }
        }
        setContentHeight();
    });

    // check active menu
    $SIDEBAR_MENU.find('a[href="' + URL + '"]').parent('li').addClass('current-page');

    $SIDEBAR_MENU.find('a').filter(function () {
        return this.href == URL;
    }).parent('li').addClass('current-page').parents('ul').slideDown(function() {
        setContentHeight();
    }).parent().addClass('active');

    // recompute content when resizing
    $(window).smartresize(function(){  
        setContentHeight();
    });
});
// /Sidebar

// Panel toolbox
$(document).ready(function() {
    $('.collapse-link').on('click', function() {
        var $BOX_PANEL = $(this).closest('.x_panel'),
            $ICON = $(this).find('i'),
            $BOX_CONTENT = $BOX_PANEL.find('.x_content');
        
        // fix for some div with hardcoded fix class
        if ($BOX_PANEL.attr('style')) {
            $BOX_CONTENT.slideToggle(200, function(){
                $BOX_PANEL.removeAttr('style');
            });
        } else {
            $BOX_CONTENT.slideToggle(200); 
            $BOX_PANEL.css('height', 'auto');  
        }

        $ICON.toggleClass('fa-chevron-up fa-chevron-down');
    });

    $('.close-link').click(function () {
        var $BOX_PANEL = $(this).closest('.x_panel');

        $BOX_PANEL.remove();
    });
});
// /Panel toolbox

// Tooltip
$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
});
// /Tooltip

// Progressbar
if ($(".progress .progress-bar")[0]) {
    $('.progress .progress-bar').progressbar(); // bootstrap 3
}
// /Progressbar

// Switchery
$(document).ready(function() {
    if ($(".js-switch")[0]) {
        var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));
        elems.forEach(function (html) {
            var switchery = new Switchery(html, {
                color: '#26B99A'
            });
        });
    }
});
// /Switchery

// iCheck
$(document).ready(function() {
    if ($("input.flat")[0]) {
        $(document).ready(function () {
            $('input.flat').iCheck({
                checkboxClass: 'icheckbox_flat-green',
                radioClass: 'iradio_flat-green'
            });
        });
    }
});
// /iCheck

// Table
$('table input').on('ifChecked', function () {
    checkState = '';
    $(this).parent().parent().parent().addClass('selected');
    countChecked();
});
$('table input').on('ifUnchecked', function () {
    checkState = '';
    $(this).parent().parent().parent().removeClass('selected');
    countChecked();
});

var checkState = '';

$('.bulk_action input').on('ifChecked', function () {
    checkState = '';
    $(this).parent().parent().parent().addClass('selected');
    countChecked();
});
$('.bulk_action input').on('ifUnchecked', function () {
    checkState = '';
    $(this).parent().parent().parent().removeClass('selected');
    countChecked();
});
$('.bulk_action input#check-all').on('ifChecked', function () {
    checkState = 'all';
    countChecked();
});
$('.bulk_action input#check-all').on('ifUnchecked', function () {
    checkState = 'none';
    countChecked();
});

function countChecked() {
    if (checkState === 'all') {
        $(".bulk_action input[name='table_records']").iCheck('check');
    }
    if (checkState === 'none') {
        $(".bulk_action input[name='table_records']").iCheck('uncheck');
    }

    var checkCount = $(".bulk_action input[name='table_records']:checked").length;

    if (checkCount) {
        $('.column-title').hide();
        $('.bulk-actions').show();
        $('.action-cnt').html(checkCount + ' Records Selected');
    } else {
        $('.column-title').show();
        $('.bulk-actions').hide();
    }
}

// Accordion
$(document).ready(function() {
    $(".expand").on("click", function () {
        $(this).next().slideToggle(200);
        $expand = $(this).find(">:first-child");

        if ($expand.text() == "+") {
            $expand.text("-");
        } else {
            $expand.text("+");
        }
    });
});

// NProgress
if (typeof NProgress != 'undefined') {
    $(document).ready(function () {
        NProgress.start();
    });

    $(window).load(function () {
        NProgress.done();
    });
}

/**
 * Resize function without multiple trigger
 * 
 * Usage:
 * $(window).smartresize(function(){  
 *     // code here
 * });
 */
(function($,sr){
    // debouncing function from John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    var debounce = function (func, threshold, execAsap) {
      var timeout;

        return function debounced () {
            var obj = this, args = arguments;
            function delayed () {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null; 
            }

            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);

            timeout = setTimeout(delayed, threshold || 100); 
        };
    };

    // smartresize 
    jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');

/*
* jQuery validator overwrite some custom methods to work with bootstrap css classes
*/
$.validator.setDefaults({
    errorElement: "span",
    errorClass: "help-block",
    highlight: function (element, errorClass, validClass) {        
        setTimeout(function(){
            $(element).closest('.form-group').addClass('has-error');    
        }, 0);         
    },
    unhighlight: function (element, errorClass, validClass) {
        $(element).closest('.form-group').removeClass('has-error');
    },
    errorPlacement: function (error, element) {
        if (element.parent('.input-group').length || element.prop('type') === 'radio') {
            error.insertAfter(element.parent());
        } else {
            error.insertAfter(element);
        }
    }
});