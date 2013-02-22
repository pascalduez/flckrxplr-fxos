
(function( window, document ) {

  window.onload = fetch;

  function fetch() {
    document.body.classList.add("loading");
    // Testing api key, get reset.
    var url = "http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=7340b7ab975eb9e2f609dc9f44a250ff&format=json";
    var script = document.createElement("script");
    script.setAttribute("src", url);
    document.head.appendChild( script );
  }

  window.jsonFlickrApi = function( data ) {
    var photos = data.photos.photo,
        fragment = document.createDocumentFragment(),
        length = photos.length,
        i = 0;

    for ( ; i < length; i++ ) {
      var img = new Image();
      img.src = buildImgSrc( photos[i] );
      img.onload = function() {
        this.classList.add("loaded");
      };

      var a = document.createElement("a");
      a.href = buildImgUrl( photos[i] );
      a.target = "_";
      a.appendChild( img );

      fragment.appendChild( a );
    }

    var main = document.querySelector("main");
    main.innerHTML = "";
    main.appendChild( fragment );

    document.body.classList.remove("loading");
    document.body.classList.add("loaded");
  }

  function buildImgSrc( photo ) {
    var str = "http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg";
    return str
      .replace( "{farm-id}", photo.farm )
      .replace( "{server-id}", photo.server )
      .replace( "{id}", photo.id )
      .replace( "{secret}", photo.secret )
      .replace( "[mstzb]", "q" );
  }

  function buildImgUrl( photo ) {
    var str = "http://www.flickr.com/photos/{user-id}/{photo-id}";
    return str
      .replace( "{user-id}", photo.owner )
      .replace( "{photo-id}", photo.id );
  }

}( this, this.document ));
