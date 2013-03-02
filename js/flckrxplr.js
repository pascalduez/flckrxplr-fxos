
(function( window, document ) {

  "use strict";

  const api_key  = "ba40cdef3b366240ebebb25271a955fe";
  const rest_url = "http://api.flickr.com/services/rest/";

  var thumbnails;
  var photos;
  var page = 1;
  var pages;

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
    _fetch( params );
    thumbnails.addEventListener("scroll", scrollHandler);
  }

  document.addEventListener("DOMContentLoaded", onDomReady, false);

  function scrollHandler() {
    if ( thumbnails.scrollTop >= thumbnails.scrollTopMax ) {
      if ( ++page > pages ) {
        return;
      }
      params.page = page;
      _fetch( params );
    }
  }

  function _createThumbnails() {
    var fragment = document.createDocumentFragment(),
        length = photos.length,
        i = 0;

    function addLoaded( e ) {
      e.target.classList.add("loaded");
    }

    for ( ; i < length; i++ ) {
      var img = new Image();
      img.src = photos[ i ].url_q;
      img.addEventListener("load", addLoaded, false);

      var a = document.createElement("a");
      a.href = _imgUrl( photos[i] );
      a.target = "_";
      a.appendChild( img );

      var li = document.createElement("li");
      li.classList.add("thumbnail");
      li.appendChild( a );

      fragment.appendChild( li );
    }

    thumbnails.appendChild( fragment );

    document.body.classList.remove("loading");
    document.body.classList.add("loaded");
  }

  function _imgUrl( photo ) {
    var str = "http://www.flickr.com/photos/{user-id}/{photo-id}";
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

  function _fetch( params ) {
    var url = rest_url + _parameterString( params );

    document.body.classList.remove("loaded");
    document.body.classList.add("loading");

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if ( xhr.status === 200 ) {
        var data = JSON.parse( xhr.responseText ).photos;
        pages = data.pages;
        photos = data.photo;
        _createThumbnails();
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
