$(function() {

    Social.setUp();
    Tracker.setUp();
    
    var id = document.location.pathname.replace('/', '');
    if (id.length > 0) {
        $('.thanks').show();
        $('body').append('<iframe width="1" height="1" frameborder="0" src="/downstream/'+id+'" style="display:none"></iframe>');
        $('.lepel').show().css({opacity: 1}).delay(300);
        $('body').on('click.downstream', function() {
            $('.thanks').css({opacity: 0}).delay(300).queue(function(){$(this).hide()});
            $('.lepel').css({opacity: 0}).delay(300).queue(function(){$(this).hide()});
            $(this).off('click.downstream');
        });
    }

    $('.link').click(function() {
        $('.lepel').css({opacity: 0}).delay(300).queue(function(){$(this).hide()});
        $('.steps li:eq(1)').removeClass('active');
        $('.steps li:eq(2)').addClass('active');
        this.select();
    });
    
    $.event.props.push('dataTransfer');
       $('#drop-area').bind({
           dragover: function(e) {
               $(this).css({backgroundColor: 'rgba(100,0,0,0.2)'});
               return false;
           },
           dragleave: function(e) {
               $(this).css({backgroundColor: ''});
               return false;
           },
           drop: function(e) {
               $(this).css({backgroundColor: ''});
               var file = e.dataTransfer.files[0];
               $('.dropda,.anyfile').hide();
               waitForReceiver(file);
               return false;
           }
       });

});

function randomPassword(length)
{
  chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  pass = "";
  for(x=0;x<length;x++)
  {
    i = Math.floor(Math.random() * 62);
    pass += chars.charAt(i);
  }
  return pass;
}

function waitForReceiver(file, id) {
    if (!id) {
        id = randomPassword(5);
        $('.steps li:eq(0)').removeClass('active');
        $('.steps li:eq(1)').addClass('active');
        $('.lelink,.useonce').show();
        $('.link').val('http://drop.atimb.me/' + id).show();
        $('.lepel').show().css({opacity: 1});
        //$('.lepel').show().css({opacity: 1});
    }
    var data = {
        id: id,
        length: file.fileSize
    };
    $.post('/pending', data, function(data) {
        if (data.go) {
            sendFile(file, id);
        } else {
            waitForReceiver(file, id);
        }
    }).error(function(data) {
        setTimeout(function() {
            waitForReceiver(file, id);
        }, 30000);
    });
}

function sendFile(file, id) {
    $('.link,.lelink,.useonce').hide();
    $('.wait').show();
    $('#progress').show();
    $('.steps li:eq(2)').removeClass('active');
    $('.steps li:eq(3)').addClass('active');
    
    var uri = "/upstream/" + id;
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    
    xhr.open("POST", uri, true);
    xhr.upload.addEventListener("progress", function(e) {  
            if (e.lengthComputable) {  
              var done = e.loaded / e.total; 
              if (done>0.99) {
                  done = 0.99;
              }
              var w = Math.round(300 * done);
              $('.progress-bar').css({width: w+'px'}).attr('data-time', Math.round(done * 100) + '%');
            }
          }, false);  
    function aborted() {
        $('.wait').hide();
        $('.abort').show();
        $('.lepel').show().css({opacity: 1});
        $('body').on('click.upstream', function() {
            $('.steps li:eq(3)').removeClass('active');
            $('.steps li:eq(0)').addClass('active');
            $('.abort').fadeOut(300);
            $('#progress').fadeOut(300);
            $('.lepel').css({opacity: 0}).delay(300).queue(function(){$(this).hide()});
            $(this).off('click.upstream');
            $('.dropda,.anyfile').fadeIn();
        });        
    }
    xhr.upload.addEventListener("error", aborted, false);
    xhr.upload.addEventListener("abort", aborted, false);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            $('.progress-bar').css({width: '300px'}).attr('data-time', '100%');
            $('.wait').hide();
            $('.done').show();
            $('.lepel').show().css({opacity: 1});
            $('body').on('click.upstream', function() {
                $('.steps li:eq(3)').removeClass('active');
                $('.steps li:eq(0)').addClass('active');
                $('.done').fadeOut(300);
                $('#progress').fadeOut(300);
                $('.lepel').css({opacity: 0}).delay(300).queue(function(){$(this).hide()});
                $(this).off('click.upstream');
                $('.dropda,.anyfile').fadeIn();
            });
        }
    };
    fd.append('myFile', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
}


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
