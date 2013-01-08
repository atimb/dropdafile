$(function() {
    Social.setUp();
    Tracker.setUp();
    Download.setUp();
    Upload.setUp();
});

var Download = {
    setUp: function() {
        var id = document.location.pathname.replace('/', '');
        if (id.length > 0) {
            $('.dropda,.anyfile').hide();
            $('.thanks').show();
            $('body').append('<iframe width="1" height="1" frameborder="0" src="/downstream/'+id+'" style="display:none"></iframe>');
            $('.lepel').show().css({opacity: 1});
            $('body').on('click.downstream', function() {
                $('.thanks').hide();
                $('.lepel').css({opacity: 0});
                setTimeout(function(){ $('.lepel').hide() }, 300);
                $('.dropda,.anyfile').fadeIn();
                $(this).off('click.downstream');
            });
        }
    }
}

var Upload = {
    
    setUp: function() {
        $.event.props.push('dataTransfer');
        $('body').bind({
            dragover: function(e) {
               $('.drop-area').addClass('active');
               return false;
            },
            dragleave: function(e) {
               $('.drop-area').removeClass('active');
               return false;
            },
            drop: function(e) {
               $('.drop-area').removeClass('active');
               if (e.dataTransfer.files.length !== 1) {
                   alert('Please drop exactly one file. Sorry :(');
                   return false;
               }
               var file = e.dataTransfer.files[0];
               Upload.waitForReceiver(file);
               return false;
            }
        });
    },
    
    generateId: function(length) {
        var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
          , pass = ""
        for (var x=0; x < length; x++) {
            var i = Math.floor(Math.random() * 62)
            pass += chars.charAt(i)
        }
        return pass
    },
    
    waitForReceiver: function(file, id) {
        if (!id) {
            id = Upload.generateId(5);
            $('.steps li:eq(0)').removeClass('active');
            $('.steps li:eq(1)').addClass('active');
            $('.dropda,.anyfile').hide();
            $('.lelink,.useonce').show();
            $('.link').on('click.newlink', function() {
                $('.lepel').css({opacity: 0});
                setTimeout(function(){ $('.lepel').hide() }, 300);
                $('.steps li:eq(1)').removeClass('active');
                $('.steps li:eq(2)').addClass('active');
                $(this).off('click.newlink');
                this.select();
            });
            $('.link').val('http://dropdafile.com/' + id).show();
            $('.qrcode').attr('src', 'http://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' + encodeURIComponent(id)).show();
            $('.lepel').show().css({opacity: 1});
        }
        var data = {
            id: id,
            length: file.size || file.fileSize
        };
        $.post('/pending', data, function(data) {
            if (data.go) {
                Upload.sendFile(file, id);
            } else {
                Upload.waitForReceiver(file, id);
            }
        }).error(function(data) {
            setTimeout(function() {
                Upload.waitForReceiver(file, id);
            }, 10000);
        });
    },

    sendFile: function(file, id) {
        $('.link,.qrcode,.lelink,.useonce').hide();
        $('.progress,.wait').show();
        $('.steps li:eq(2)').removeClass('active');
        $('.steps li:eq(3)').addClass('active');
    
        var uri = "/upstream/" + id;
        var xhr = new XMLHttpRequest();
        var fd = new FormData();
    
        // display progress
        xhr.upload.addEventListener("progress", function(e) {  
            if (e.lengthComputable) {  
                var done = e.loaded / e.total; 
                if (done > 0.99) {
                    done = 0.99;
                }
                var w = Math.round(300 * done);
                $('.progress-bar').css({width: w+'px'}).attr('data-time', Math.round(done * 100) + '%');
            }
        }, false);
        
        // what if something wrong happens
        function aborted() {
            $('.wait').hide();
            $('.abort').show();
            $('.lepel').show().css({opacity: 1});
            $('body').on('click.upstream', function() {
                $('.steps li:eq(3)').removeClass('active');
                $('.steps li:eq(0)').addClass('active');
                $('.progress,.abort').hide();
                $('.lepel').css({opacity: 0});
                setTimeout(function(){ $('.lepel').hide() }, 300);
                $(this).off('click.upstream');
                $('.dropda,.anyfile').fadeIn();
            });        
        }
        xhr.upload.addEventListener("error", aborted, false);
        xhr.upload.addEventListener("abort", aborted, false);
        
        // what if upload finishes
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                $('.progress-bar').css({width: '300px'}).attr('data-time', '100%');
                $('.wait').hide();
                $('.done').show();
                $('.lepel').show().css({opacity: 1});
                $('body').on('click.upstream', function() {
                    $('.steps li:eq(3)').removeClass('active');
                    $('.steps li:eq(0)').addClass('active');
                    $('.progress,.done').hide();
                    $('.lepel').css({opacity: 0});
                    setTimeout(function(){ $('.lepel').hide() }, 300);
                    $(this).off('click.upstream');
                    $('.dropda,.anyfile').fadeIn();
                });
            }
        };
        
        // Initiate a multipart/form-data upload
        fd.append('myFile', file);
        xhr.open("POST", uri, true);
        xhr.send(fd);
    }
}

// the mandatory tracker
var Tracker = {
    setUpGoogleAnalytics : function() {
        window._gaq = window._gaq || [];
        window._gaq.push(['_setAccount', 'UA-31383816-1']);
        window._gaq.push(['_trackPageview']);
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    },
    setUp : function() {
        this.setUpGoogleAnalytics();
    }
};

// the mandatory social buttons
var Social = {
    setUpPlusButton : function() {
        var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
        po.src = 'https://apis.google.com/js/plusone.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
    },
    setUpLikeButton : function() {
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=302001246494798";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));        
    },
    setUpTweetButton : function() {
        (function(d,s,id){
            var js,fjs=d.getElementsByTagName(s)[0];
            if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js,fjs);}
        })(document,"script","twitter-wjs");
    },
    setUp : function() {
        this.setUpPlusButton();
        this.setUpTweetButton();
        this.setUpLikeButton();
    }   
};
