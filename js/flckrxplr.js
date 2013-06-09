
(function( window, document ) {

  "use strict";

  const API_KEY  = "ba40cdef3b366240ebebb25271a955fe";
  const REST_URL = "http://api.flickr.com/services/rest/";

  var db = {};
  var uniqueId = 0;

  var thumbnails;
  var pages = { current: 1, max: null };
  var sampleThumb;
  var triggerMargin;
  var observer;

  var params = {
      "method" : "flickr.interestingness.getList",
     "api_key" : API_KEY,
        "date" : null,
      "extras" : ["url_q"],
    "per_page" : 30,
        "page" : 1,
      "format" : "json",
    "nojsoncallback" : "1"
  };

  var views = {
    "thumbnails": null,
    "fullscreen": null
  };

  function $(id) { return document.getElementById(id); }

  function injectTpl( tpl, cb ) {
    //document.body.appendChild( tpl );
    tpl.style.display = "block";
    if (cb) window.setTimeout( cb, 10 );
    //document.body.appendChild( tpl.content.cloneNode(true) );
  }
  function removeTpl( tpl ) {
    tpl.style.display = "none";
    //document.body.removeChild( tpl );
  }

  function onDomReady() {
    views.thumbnails = $("thumbnails-view");
    views.fullscreen = $("fullscreen-view");

    injectTpl( views.thumbnails );

    // Temporary Shortcut
    thumbnails = $("thumbnails");

    observer = new MutationObserver(function( mutations ) {
      mutations.forEach(function( mutation ) {
        if ( mutation.type === "childList" ) {
          let nodes = mutation.addedNodes;
          sampleThumb = nodes[ nodes.length - 1 ];
          // if ( !sampleThumb ) {
          //   sampleThumb = nodes[ 1 ];
          // }
          sampleThumb.addEventListener("transitionend", function onThumbFadeEnd() {
            getRowHeight();
            thumbnails.addEventListener("scroll", scrollHandler);
            sampleThumb.removeEventListener("transitionend", onThumbFadeEnd);
          }, false);

          //window.addEventListener("resize", getRowHeight);
        }
      });
    });
    observer.observe( thumbnails, { childList: true } );

    // Fetch the first page.
    fetch( params );
  }

  document.addEventListener("DOMContentLoaded", onDomReady, false);

  function onContentEnd() {
    window.removeEventListener("resize", getRowHeight);
    thumbnails.removeEventListener("scroll", scrollHandler);
    observer.disconnect();
  }

  function scrollHandler() {
    // Ignore scrolls while thumbnails is empty.
    if ( thumbnails.clientHeight === 0 ) {
      return;
    }
    // Start fetching ~5 rows before end of current batch/page.
    if ( thumbnails.scrollTop > (thumbnails.scrollTopMax - (triggerMargin * 5)) ) {
      if ( ++pages.current > pages.max ) {
        onContentEnd();
        return;
      }
      thumbnails.removeEventListener("scroll", scrollHandler);
      params.page = pages.current;
      fetch( params );
    }
  }

  function getRowHeight() {
    triggerMargin = sampleThumb.clientHeight;
  }

  window.addEventListener("resize", getRowHeight);


  function backBtn() {
    let backBtn = $("fullscreen-back-button");
    backBtn.addEventListener("click", function() {
      views.fullscreen.classList.remove("enabled");
      views.fullscreen.addEventListener("transitionend", function onFullScreenFadeEnd() {
        removeTpl( views.fullscreen );
        views.fullscreen.removeEventListener("transitionend", onFullScreenFadeEnd);
      }, false);
    }, false);
  }


  function addFullScreenImg( e ) {
    let id = e.currentTarget.getAttribute("data-id");
    //let img = new Image();
    //
    //
    let cachedImg = db[ id ];
    let src = _imgSrc( cachedImg, "n" );
    let frame = $("frame2");
    frame.style.backgroundImage = 'url("' + src + '")';


    // let cachedImg = db[ id - 1 ];
    // let src = _imgSrc( cachedImg, "z" );
    // let frame1 = $("frame1");
    // frame1.style.backgroundImage = 'url("' + src + '")';

    // cachedImg = db[ id ];
    // src = _imgSrc( cachedImg, "z" );
    // let frame2 = $("frame2");
    // frame2.style.backgroundImage = 'url("' + src + '")';

    // cachedImg = db[ id + 1 ];
    // src = _imgSrc( cachedImg, "z" );
    // let frame3 = $("frame3");
    // frame3.style.backgroundImage = 'url("' + src + '")';
  }


  function createThumbnails( photos ) {
    let fragment = document.createDocumentFragment();
    let length = photos.length;
    let i = 0;

    function _addLoaded( e ) {
      let thumb = e.target.parentNode.parentNode;
      thumb.classList.add("loaded");
    }

    function _onClick( e ) {
      e.preventDefault();
      injectTpl( views.fullscreen, function() {
        views.fullscreen.classList.add("enabled");
      });
      addFullScreenImg( e );
      backBtn();
    }

    for ( ; i < length; i++ ) {
      let img = new Image();
      img.src = photos[ i ].url_q;
      img.addEventListener("load", _addLoaded, true);

      let a = document.createElement("a");
      a.setAttribute("data-id", photos[ i ]["uniqueId"]);
      a.href = _imgUrl( photos[i] );
      // a.target = "_";
      a.addEventListener("click", _onClick, false);
      a.appendChild( img );

      let li = document.createElement("li");
      li.classList.add("thumbnail");
      li.appendChild( a );

      fragment.appendChild( li );
    }

    thumbnails.appendChild( fragment );

    document.body.classList.remove("loading");
  }


  function _imgSrc( photo, size ) {
    return "http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg"
      .replace( "{farm-id}", photo.farm )
      .replace( "{server-id}", photo.server )
      .replace( "{id}", photo.id )
      .replace( "{secret}", photo.secret )
      .replace( "[mstzb]", size );
  }


  function _imgUrl( photo ) {
    return "http://www.flickr.com/photos/{user-id}/{photo-id}"
      .replace( "{user-id}", photo.owner )
      .replace( "{photo-id}", photo.id );
  }


  function _parameterString( params ) {
    let paramsArray = [];

    for ( let [key, value] in Iterator(params) ) {
      let encodedValue;
      if ( value !== null ) {
        if ( Array.isArray( value ) ) {
          encodedValue = value.map(function( item ) {
            return encodeURIComponent(
              ( item === null || item === undefined ) ? "" : item
            );
          }).join(",");
        }
        else {
          encodedValue = encodeURIComponent( value );
        }
        paramsArray.push( encodeURIComponent( key ) + "=" + encodedValue );
      }
    }

    return paramsArray.join("&");
  }


  function pushToDb( data ) {
    for ( let item in data.photo ) {
      ++uniqueId;
      let photo = data.photo[ item ];
      db[ uniqueId ] = photo;
      db[ uniqueId ]["uniqueId"] = uniqueId;
    }
    // console.log(db);
  }


  function fetch( params ) {
    let url = [ REST_URL, "?", _parameterString( params ) ].join("");

    document.body.classList.add("loading");

    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if ( xhr.status === 200 ) {
        let data = JSON.parse( xhr.responseText ).photos;
        pushToDb( data );
        pages.current = data.page;
        pages.max = data.pages;
        createThumbnails( data.photo );
      }
    };
    xhr.onerror = function() {
      window.alert("fetch error");
      document.body.classList.remove("loading");
    };
    xhr.open("GET", url, true);
    xhr.send();
  }


}( this, this.document ));
