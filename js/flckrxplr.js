
(function( window, document ) {

  "use strict";

  const api_key  = "ba40cdef3b366240ebebb25271a955fe";
  const rest_url = "http://api.flickr.com/services/rest/";

  var thumbnails;
  var pages = { current: 1, max: null };
  var sampleThumb;
  var triggerMargin;
  var observer;

  var params = {
      "method" : "flickr.interestingness.getList",
     "api_key" : api_key,
        "date" : null,
      "extras" : ["url_q"],
    "per_page" : 100,
        "page" : 1,
      "format" : "json",
    "nojsoncallback" : "1"
  };

  function onDomReady() {
    thumbnails = document.getElementById("thumbnails");

    observer = new MutationObserver(function( mutations ) {
      mutations.forEach(function( mutation ) {
        if ( mutation.type === "childList" ) {
          let nodes = mutation.addedNodes;
          sampleThumb = nodes[ nodes.length -1 ];
          sampleThumb.addEventListener("transitionend", function onThumbFadeEnd() {
            triggerMargin = sampleThumb.clientHeight * 5;
            thumbnails.addEventListener("scroll", scrollHandler);
            sampleThumb.removeEventListener("transitionend", onThumbFadeEnd);
          }, false);
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
    if ( thumbnails.scrollTop > (thumbnails.scrollTopMax - triggerMargin) ) {
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

  function createThumbnails( photos ) {
    let fragment = document.createDocumentFragment();
    let length = photos.length;
    let i = 0;

    function _addLoaded( e ) {
      let thumb = e.target.parentNode.parentNode;
      thumb.classList.add("loaded");
    }

    for ( ; i < length; i++ ) {
      let img = new Image();
      img.src = photos[ i ].url_q;
      img.addEventListener("load", _addLoaded, true);

      let a = document.createElement("a");
      a.href = _imgUrl( photos[i] );
      a.target = "_";
      a.appendChild( img );

      let li = document.createElement("li");
      li.classList.add("thumbnail");
      li.appendChild( a );

      fragment.appendChild( li );
    }

    thumbnails.appendChild( fragment );

    document.body.classList.remove("loading");
    document.body.classList.add("loaded");
  }


  function _imgSrc( photo ) {
    let str = "http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg";
    return str
      .replace( "{farm-id}", photo.farm )
      .replace( "{server-id}", photo.server )
      .replace( "{id}", photo.id )
      .replace( "{secret}", photo.secret )
      .replace( "[mstzb]", "q" );
  }


  function _imgUrl( photo ) {
    let str = "http://www.flickr.com/photos/{user-id}/{photo-id}";
    return str
      .replace( "{user-id}", photo.owner )
      .replace( "{photo-id}", photo.id );
  }


  function _parameterString( params ) {
    let paramsArray = [];

    for ( let [key, value] in Iterator(params) ) {
      let encodedValue;
      if ( value != null ) {
        if ( Array.isArray( value ) ) {
          let encodedValueArray = [];
          value.forEach(function( item ) {
            encodedValueArray.push(encodeURIComponent(
              ( item === null || item === undefined) ? "" : item )
            );
          });
          encodedValue = encodedValueArray.join(",");
        }
        else {
          encodedValue = encodeURIComponent( value );
        }
        paramsArray.push(encodeURIComponent( key ) + "=" + encodedValue);
      }
    }

    return "?" + paramsArray.join("&");
  }


  function fetch( params ) {
    let url = rest_url + _parameterString( params );

    document.body.classList.remove("loaded");
    document.body.classList.add("loading");

    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if ( xhr.status === 200 ) {
        let data = JSON.parse( xhr.responseText ).photos;
        pages.current = data.page;
        pages.max = data.pages;
        createThumbnails( data.photo );
      }
    };
    xhr.onerror = function() {
      window.alert("fetch error");
      document.body.classList.remove("loading");
      document.body.classList.add("loaded");
    };
    xhr.open("GET", url, true);
    xhr.send();
  }


}( this, this.document ));
