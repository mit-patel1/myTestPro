var Core = {
    colorCode : {},
    MsgType: {
        Error: 0,
        Success: 1,
        Warning: 2
      },
    getParameterByName: function (name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);        
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },
    post: function (url, postData, callback, dataType, contentType) {
        var processData = true;
        var ajaxParam = {
            dataType: dataType || "json",
            type: "POST",
            url: url,
            data: postData,
            headers: {
                "X-CSRFToken": Core.getStorage("csrftoken")
            },
            beforeSend: function() {
                // $('#loading-image').show();
            },
            complete: function() {
                $('#loading-image').hide();
            },
            success: function (data) {
                $('#loading-image').hide();              
                if (callback) {
                    callback($.parseJSON(JSON.stringify(data))); 
                }
            },
            error: function (errorData) {       
                $('#loading-image').hide();         
                if (callback) {
                    //callback({ Status: 0 });
                }
            }
        };

        if(typeof contentType !== typeof undefined) {
          if(!contentType) {
            ajaxParam['contentType'] = contentType;
            processData = false
          }
        }

        if(typeof processData !== typeof undefined) {
          ajaxParam['processData'] = processData;
        }

        $.ajax(ajaxParam);
    },
    setDatePicker: function(){
        $('.datePicker').datepicker({
            format: 'dd/mm/yyyy',
            autoclose: true,
            defaultDate: 'date',
        }).on('show', function(e) {
            setTimeout(function(){
                $('.datepicker').css('z-index', 99999999999999);
            }, 0);
        });
    },
    showMessage: function(id, type, msg, time) {
        $('#' + id).text(msg).removeClass()
        if (type == Core.MsgType.Error) {
            $('#' + id).html(msg).addClass('alert alert-danger').show();
        } else {
            $('#' + id).html(msg).addClass('alert alert-success').show();
        }

        if (time) {
            setTimeout(function() {
                $('#' + id).hide()
            }, time * 1000);
        }
    },

    dateFormate: function(date, type) {
        date = date.split(/:|  | |-|\//);
        if(type == "dd/mm/yyyy") {
            return new Date(date[2], date[1] - 1, date[0], date[3], date[4], 0);
        }
        else if(type == "yyyy/mm/dd") {
            return new Date(date[0], date[1] - 1, date[2], date[3], date[4], 0);
        }
        else if(type == "mm/dd/yyyy") {
            return new Date(date[2], date[0] - 1, date[1], date[3], date[4], 0);    
        }
        return new Date(date[2], date[1] - 1, date[0])
    },

    getRandomColor: function(key) {
        if(!(key in Core.colorCode)) {
            var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
            var mixedrgb = [rgb[0], rgb[1], rgb[2]].map(function(x){ return Math.round(x/2.0)})
            color = "rgb(" + mixedrgb.join(",") + ")";
            Core.colorCode[key] = color;
        }
        return Core.colorCode[key];
    },
    setStorage: function(key,value,expires) {
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
    },
    getStorage: function(key) {
        var now = Date.now();  //epoch time, lets deal only with integer
        // set expiration for storage
        var expiresIn = localStorage.getItem(key+'_expiresIn');
        if (expiresIn===undefined || expiresIn===null) { expiresIn = 0; }

        if (expiresIn < now) {// Expired
            Core.removeStorage(key);
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
    },
    removeStorage: function(key) {
        try {
            localStorage.removeItem(key);
            localStorage.removeItem(key + '_expiresIn');
        } catch(e) {
            console.log('removeStorage: Error removing key ['+ key + '] from localStorage: ' + JSON.stringify(e) );
            return false;
        }
        return true;
    },
    canAutoWidth : function(scale) {
        if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
            return false;
        }
        return true;
    },

    getColumnWidth: function(widthEnabled, scale, zoom) {                
        if (!widthEnabled && Core.canAutoWidth(scale)) {
            return undefined;
        }
        
        if (scale.match(/.*?week.*?/)) {
            return 150 * zoom;
        }

        if (scale.match(/.*?month.*?/)) {
            return 300 * zoom;
        }

        if (scale.match(/.*?quarter.*?/)) {
            return 500 * zoom;
        }

        if (scale.match(/.*?year.*?/)) {
            return 800 * zoom;
        }

        return 40 * zoom;
    }
}

