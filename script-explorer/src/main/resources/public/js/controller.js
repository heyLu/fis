/*
 * Controller to control Website flow
 *
 * Copyright (c) 2016 Immanuel Plath
 */

var app = angular.module('movieExplorer', []);

app.run(function($rootScope) {
    $rootScope.movieScriptHtml = "";
    $rootScope.directions = false;
    $rootScope.internals = false;
    $rootScope.externals = false;
    $rootScope.openFilterValue = true;
    $rootScope.waitForTimeline = true;
    //$rootScope.personListBoolean = new Array ();
    $rootScope.personListBoolean = new Array ();
    $rootScope.personList = {};
    $rootScope.locationListBoolean = new Array ();
    $rootScope.locationList = {};
});

app.controller('movieCtrl', function($scope, $http, $sce, $compile, $rootScope) {
  // control visibillity
  $scope.intro = false;
  $scope.navbar = true;
  $scope.navbarMovieDescription = true;
  $scope.navbarFlowChart = true;
  $scope.navbarScript = true;
  $scope.timeline = true;
  $scope.flowchart = true;
  $scope.movieDescription = true;
  $scope.warning = true;
  $scope.movie = "";
  $scope.movieID = 19995;
  $scope.lastMovie = "";
  $scope.movieList = [];
  $scope.movieScript = false;
  $scope.movieScriptHtml = "";

  // movie description data
  $scope.movieTitle = "";
  $scope.movieOverview = "";
  $scope.movieTagline = "";
  $scope.movieVoteAverage = 0;
  $scope.movieVoteCount = 0;
  $scope.movieAdult = "";
  $scope.moviePoster = "";
  $scope.movieHomepage = "";
  $scope.movieBudget = "";
  $scope.moviePartOf = "";
  $scope.movieReleaseDate = "";
  $scope.movieRevenue = "";
  $scope.movieRuntime = "";
  $scope.movieLanguages = [];
  $scope.movieCompanies = [];
  $scope.movieCountries = [];
  $scope.movieGenres = [];

  // movie credits
  $scope.movieCast = [];
  $scope.movieCrew = [];

  // get movie list
  $http({
    method: 'GET',
    dataType: "json",
    url: 'http://localhost:4567/res/movieNames.json'
  }).then(function successCallback(response) {
    $scope.movieList = response.data;
  }, function errorCallback(response) {
    // called asynchronously if an error occurs
  });

  // Website flow control
  // ###############################
  $scope.selectMovie = function() {
    // workaround chrome and ie typeahed not read clicked item
    var movieT = $("#movieName").val();
    if (movieT.length > $scope.movie.length) {
      $scope.movie = movieT;
    }
    console.log("Name: " + $scope.movie);
    if ($scope.movie.length > 0) {
      $scope.navbar = false;
      $scope.timeline = false;
      $scope.intro = true;
      $scope.flowchart = true;
      $scope.movieDescription = true;
      $scope.warning = true;
      // check input string if a other movie was selected
      // prevent to do the same work twice
      if( $scope.movie != $scope.lastMovie ){
        // reset Timeline
        angular.element(document.getElementById('insertTimeline')).html('');
        // get tmdb id belongs to selected movie
        $scope.movieID = $scope.searchMovieID( $scope.movie );
        // check if TMDB have data
        $rootScope.waitForTimeline = false;
        if( $scope.movieID == 0) {
          $scope.navbarMovieDescription = true;
          // load movie script data
          $scope.loadMovieScript( $scope.movie, [] );
        } else {
          $scope.navbarMovieDescription = false;
          // load movie description data
          $scope.loadMovieDescriptionData( $scope.movieID  );
          $scope.loadMovieCredits( $scope.movieID  );
        }
        // load movie flow diagramms (to do)
        var p = new PlotChart("#chart", "chart", $scope.movie);
      } else {
        // check which functions to display in navbar
        if( $scope.movieID == 0) {
          $scope.navbarMovieDescription = true;
        } else {
          $scope.navbarMovieDescription = false;
        }
        if( $scope.movieScript === false){
          $scope.navbarScript = true;
          $scope.navbarFlowChart = true;
          if( $scope.movieID == 0) {
            // return to home because no data available
            $scope.intro = false;
            $scope.navbar = true;
            $scope.navbarScript = true;
            $scope.navbarFlowChart = true;
            $scope.timeline = true;
            $scope.flowchart = true;
            $scope.movieDescription = true;
            $scope.warning = false;
          } else {
            $scope.movieDescription = false;
            $scope.timeline = true;
          }
        } else {
          $scope.navbarScript = false;
          $scope.navbarFlowChart = false;
        }
      }
    }
  };

  $scope.viewMovieData = function() {
    $scope.intro = true;
    $scope.navbar = false;
    $scope.timeline = true;
    $scope.movieDescription = false;
    $scope.flowchart = true;
  };

  $scope.viewTimeline = function() {
    $scope.intro = true;
    $scope.navbar = false;
    $scope.timeline = false;
    $scope.movieDescription = true;
    $scope.flowchart = true;
  };

  $scope.viewFlowchart = function() {
    $scope.intro = true;
    $scope.navbar = false;
    $scope.timeline = true;
    $scope.movieDescription = true;
    $scope.flowchart = false;
  };

  // Reset all visible parts and show home page
  $scope.home = function() {
    $scope.lastMovie = $scope.movie;
    $scope.movie = "";
    $("#movieName").val("");
    $scope.intro = false;
    $scope.navbar = true;
    $scope.timeline = true;
    $scope.movieDescription = true;
    $scope.flowchart = true;
    $scope.navbarMovieDescription = true;
    $scope.navbarScript = true;
    $scope.navbarFlowChart = true;
    $scope.warning = true;
  };

  // helper functions
  // ###############################
  // helper to display stars
  $scope.getNumber = function(num) {
    return new Array(num);
  };

  $scope.shortActer = function(acter) {
    var index = acter.indexOf("(");
    if (index > -1) {
      return acter.substring(0, index).trim();
    } else {
      return acter;
    }
  };

  $scope.compareActers = function(acter1, acter2) {
    if (acter1.search( new RegExp(acter2, 'i') ) > -1) {
      return true;
    } else {
      return false;
    }
  };

  $scope.searchMovieID = function(movieName) {
    var id = 0;
    $scope.movieList.forEach(function(entry) {
      if ( movieName == entry.name) {
        id = entry.id;
      }
    });
    return id;
  };

  $scope.filterCrewData = function(crewData) {
    var departments = [];
    // reorder data from tmdb
    crewData.forEach(function(entry) {
      // check if source object from tmdb has department property
      if (entry.hasOwnProperty("department")) {
        // search for department in own department array
        if (departments.length > 0) {
          var depFound = false;
          var indexInArray = 0;
          for (var i = 0; i < departments.length; i++) {
            if (departments[i].name == entry.department) {
              depFound = true;
              indexInArray = i;
            }
          }
          if (depFound) {
            // add person to persons array of the department
            departments[indexInArray].persons.push(entry);
          } else {
            // create new entry
            departments.push({
              name: entry.department,
              persons: [entry]
            });
          }
        } else {
          // add first element
          departments.push({
            name: entry.department,
            persons: [entry]
          });
        }
      }
    });
    return departments;
  };

  $scope.createTimeline = function(jsonData, acterList) {
    var masterHtml = "";
    var sceneIndex = 1;
    var toggle = false;
    var indexPersonArray = 0;
    var indexLocationArray = 0;
    var personList = {};
    var personListBoolean = new Array ();
    var personCount = {};
    var locationList = {};
    var locationListBoolean = new Array ();
    jsonData.forEach(function(scene) {
      // create scenen titel
      masterHtml += $scope.createScene( sceneIndex );
      sceneIndex++;
      // create location
      scene.forEach(function(location) {
        // create top line plus location information
        if ( !(location.hasOwnProperty("place")) || (!location.place) ){
          location.place = "Unkown";
        }
        if ( !(location.hasOwnProperty("type")) || (!location.type) ){
          location.type = "Unkown";
        }
        if( locationList[location.place] ){
          locationList[location.place].count = locationList[location.place].count + 1;
        } else {
          locationList[location.place] = {name : location.place, count: 1, posinArray: indexLocationArray, locType: location.type};
          locationListBoolean[indexLocationArray] = false;
          indexLocationArray++;
        }
        masterHtml += $scope.createLocation( location.place, location.type, locationList[location.place].posinArray );
        // reset toggle before create comments
        toggle = false;
        // start comment list
        masterHtml += '<ul class="timeline" ng-hide="locationListBoolean[' + locationList[location.place].posinArray + ']">';
        // create comments plus directions
        location.parts.forEach(function(comment) {
          var classNameComment = "";
          if( toggle ) {
            classNameComment = "timeline-inverted";
            toggle = false;
          } else {
            toggle = true;
          }
          // check if oject is a direction if true post a comment in direction style
          if (comment.hasOwnProperty("direction")) {
            masterHtml += $scope.createDirection( comment.direction, classNameComment);
          }
          // check if oject has a dialog and create standard comment
          if(comment.hasOwnProperty("dialog")) {
            var dialogStrings = "";
            // watch all dialog objects in Array
            comment.dialog.forEach(function(dialog) {
              if(dialog.hasOwnProperty("direction")) {
                // do nothing
              } else {
                dialogStrings += dialog;
              }
            });
            //check if person is lookup array
            var acterParsed = $scope.shortActer(comment.character);
            var foundItem = false;
            if(personList[acterParsed]){
              masterHtml += $scope.createComment(personList[acterParsed].originName, comment.character, personList[acterParsed].url, classNameComment, dialogStrings, personList[acterParsed].posInArray);
              personList[acterParsed].counter = (personList[acterParsed].counter+1);
            } else {
              if (acterParsed.length > 0) {
                acterList.forEach(function(person) {
                  if (!foundItem) {
                    if( $scope.compareActers(person.character, acterParsed) ) {
                      if (person.profile_path.length > 0) {
                        personList[acterParsed] = { originName: person.name , url: ("https://image.tmdb.org/t/p/w45" + person.profile_path), acterName: acterParsed, counter: 1, posInArray: indexPersonArray };
                        personListBoolean[indexPersonArray] = false;
                        indexPersonArray++;
                      } else {
                        personList[acterParsed] = { originName: person.name , url: "img/no-profile-w45.jpg", acterName: acterParsed, counter: 1, posInArray: indexPersonArray };
                        personListBoolean[indexPersonArray] = false;
                        indexPersonArray++;
                      }
                      foundItem = true;
                    }
                  }
                });
              } else {
                personList[acterParsed] = { originName: "Unkown", url: "img/no-profile-w45.jpg", acterName: acterParsed, counter: 1, posInArray: indexPersonArray };
                personListBoolean[indexPersonArray] = false;
                indexPersonArray++;
                foundItem = true;
              }
              if (!foundItem) {
                personList[acterParsed] = { originName: "Unkown", url: "img/no-profile-w45.jpg", acterName: acterParsed, counter: 1, posInArray: indexPersonArray };
                personListBoolean[indexPersonArray] = false;
                indexPersonArray++;
              }
              masterHtml += $scope.createComment(personList[acterParsed].originName, comment.character, personList[acterParsed].url, classNameComment, dialogStrings, personList[acterParsed].posInArray);
            }
          }
        });
        // end comment list
        masterHtml += '<li class="clearfix" style="float: none;"></li>';
        masterHtml += '</ul>';
      });
    });
    //$scope.movieScriptHtml = $sce.trustAsHtml( masterHtml );
    $rootScope.personListBoolean = personListBoolean;
    $rootScope.personList = personList;
    $rootScope.locationListBoolean = locationListBoolean;
    $rootScope.locationList = locationList;

    $rootScope.movieScriptHtml = masterHtml;
  }

  $scope.createScene = function(sceneNumber) {
    var scene = '<h3 class="page-header">Scene Number ' + sceneNumber + ' | {{movie}}</h3>';
    return scene;
  }

  $scope.createLocation = function(place, type, arrayIndex) {
    var location = '';
    location += '<!-- break line -->';
    location += '<h3 class="page-header" ng-hide="locationListBoolean[' + arrayIndex + ']">CUT TO Location ';
    location +=   '<small>Place » ' + place + ' | </small>';
    location +=   '<small>Type » ' + type + '</small>';
    location += '</h3>';
    return location;
  }

  $scope.createComment = function(actor, movieName, url, inverted, speech, arrayIndex) {
    var comment = '';
    comment +='<li ng-hide="personListBoolean[' + arrayIndex + ']" class="' + inverted + '">';
    comment +=  '<div class="timeline-badge primary"><a><i class="glyphicon glyphicon-record" rel="tooltip" title="' + movieName + '"></i></a>';
    comment +=  '</div>';
    comment +=  '<div class="timeline-panel">';
    comment +=    '<div class="timeline-heading">';
    comment +=      '<div class="row">';
    comment +=        '<div class="col-md-2 timeline-heading-img">';
    comment +=          '<img fallback-src="img/no-profile-w45.jpg" ng-src="' + url + '" alt="' + movieName + '">';
    comment +=        '</div>';
    comment +=        '<div class="col-md-10 timeline-heading-speaker">';
    comment +=          '<h2>' + movieName;
    comment +=            '<small> » ' + actor + '</small>';
    comment +=          '</h2>';
    comment +=        '</div>';
    comment +=      '</div>';
    comment +=    '</div>';
    comment +=    '<div class="timeline-body">';
    comment +=      '<p>&bdquo;' + speech + '&rdquo;</p>';
    comment +=    '</div>';
    comment +=  '</div>';
    comment +='</li>';
    return comment;
  }

  $scope.createDirection = function(comment, inverted) {
    var direction = '';
    direction +='<li ng-hide="directions" class="' + inverted + '">';
    direction +=  '<div class="timeline-badge primary"><a><i class="glyphicon glyphicon-record" rel="tooltip" title="Direction"></i></a>';
    direction +=  '</div>';
    direction +=  '<div class="timeline-panel">';
    direction +=    '<div class="timeline-footer">';
    direction +=      '<h3 class="direction-heading">Direction</h3>';
    direction +=      '<p>' + comment + '</p>';
    direction +=    '</div>';
    direction +=  '</div>';
    direction +='</li>';
    return direction;
  }

  $scope.loadMovieDescriptionData = function(movieID) {
    $http({
      method: 'GET',
      url: 'http://localhost:4567/api/movie/' + movieID
    }).then(function successCallback(response) {
      // tmdb error Avatar faild to load that but the others not !?
      try {
        $scope.moviePartOf = response.data.belongs_to_collection.name;
      } catch (e) {
        //
      } finally {
        //
      }
      $scope.movieTitle = response.data.original_title;
      $scope.movieOverview = response.data.overview;
      $scope.movieTagline = response.data.tagline;
      $scope.movieVoteAverage = Math.round( response.data.vote_average );
      $scope.movieVoteCount = response.data.vote_count;
      $scope.movieAdult = response.data.adult;
      $scope.movieHomepage = response.data.homepage;
      $scope.movieBudget = response.data.budget;
      //$scope.moviePartOf = response.data.belongs_to_collection.name;
      $scope.movieReleaseDate = response.data.release_date;
      $scope.movieRevenue = response.data.revenue;
      $scope.movieRuntime = response.data.runtime;
      $scope.moviePoster = "https://image.tmdb.org/t/p/original/" + response.data.poster_path;
      $scope.movieLanguages = response.data.spoken_languages;
      $scope.movieCompanies = response.data.production_companies;
      $scope.movieCountries = response.data.production_countries;
      $scope.movieGenres = response.data.genres;
    }, function errorCallback(response) {
      // called asynchronously if an error occurs
    });
  };

  $scope.loadMovieCredits = function(movieID) {
    $http({
      method: 'GET',
      url: 'http://localhost:4567/api/movie/credits/' + movieID
    }).then(function successCallback(response) {
      $scope.movieCast = response.data.cast;
      // Bugfix for fallback image
      $scope.movieCast.forEach(function(entry) {
        if (!(entry.hasOwnProperty("profile_path"))) {
          entry.profile_path = "";
        }
      });
      $scope.movieCrew = $scope.filterCrewData(response.data.crew);
      $scope.loadMovieScript( $scope.movie, $scope.movieCast );
    }, function errorCallback(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      // error while try to fetch movie information data from tmdb (disable function)
      console.log("Was in Error log");
      $scope.loadMovieScript( $scope.movie, [] );
      $scope.navbarMovieDescription = true;
    });
  };

  $scope.loadMovieScript = function(movieName, acterList) {
    $http({
      method: 'GET',
      dataType: "json",
      url: 'http://localhost:4567/api/movie/json/' + encodeURIComponent(movieName + '.json')
    }).then(function successCallback(response) {
      // make timeline in navbar available
      $scope.navbarScript = false;
      $scope.navbarFlowChart = false;
      $scope.movieScript = [];
      // create timeline
      $scope.createTimeline(response.data, acterList);
    }, function errorCallback(response) {
      // if no script was found
      // disable timeline in navbar
      $scope.navbarScript = true;
      $scope.navbarFlowChart = true;
      $scope.movieScript = false;
      // diasbale wait bar
      $rootScope.waitForTimeline = true;
      // if no data is available return to home
      if( $scope.movieID  == 0 ) {
        $scope.movie = "";
        $("#movieName").val("");
        $scope.intro = false;
        $scope.navbar = true;
        $scope.timeline = true;
        $scope.flowchart = true;
        $scope.movieDescription = true;
        $scope.navbarMovieDescription = true;
        $scope.warning = false;
      } else {
        // if no timeline is available but movie description enable this
        $scope.timeline = true;
        $scope.movieDescription = false;
      }
    });
  };

});

app.controller('CtrlTimeline', function($scope, $http, $sce, $compile, $rootScope, $rootElement) {
    $rootScope.$watch('movieScriptHtml', function() {
      var html = $rootScope.movieScriptHtml;
      var linkingFunction = $compile(html);
      var elem = linkingFunction($scope);
      angular.element(document.getElementById('insertTimeline')).html('');
      angular.element(document.getElementById('insertTimeline')).append(elem);
      $rootScope.waitForTimeline = true;
    });
});

app.controller('CtrlFilter', function($scope, $http, $sce, $compile, $rootScope, $rootElement) {
    $scope.toogleLocations = function(toggle) {
      $('.sliderBox').each(function(i, obj) {
        $(obj).bootstrapToggle();
        if ( $(obj).attr('data-location') == "location" ) {
          if (toggle == "on") {
            $(obj).bootstrapToggle('on');
          } else {
            $(obj).bootstrapToggle('off');
          }
        }
      });
    };

    $scope.tooglePersons = function(toggle) {
      $('.sliderBox').each(function(i, obj) {
        $(obj).bootstrapToggle();
        if ( $(obj).attr('data-location') == "person" ) {
          if (toggle == "on") {
            $(obj).bootstrapToggle('on');
          } else {
            $(obj).bootstrapToggle('off');
          }
        }
      });
    };

    $scope.openFilter = function() {
      if($rootScope.openFilterValue){
        $('#filterButton').html('<i class="fa fa-cog"></i> Apply & Close Filter');
        $rootScope.openFilterValue = false;

        if ( $rootScope.directions ) {
          $('#directionsInput').bootstrapToggle('off');
        } else {
          $('#directionsInput').bootstrapToggle('on');
        }
        if ( $rootScope.internals ) {
          $('#internalInput').bootstrapToggle('off');
        } else {
          $('#internalInput').bootstrapToggle('on');
        }
        if ( $rootScope.externals ) {
          $('#externalInput').bootstrapToggle('off');
        } else {
          $('#externalInput').bootstrapToggle('on');
        }
        // activate silde boxes
        $('.sliderBox').each(function(i, obj) {
          $(obj).bootstrapToggle();
          if ( $(obj).attr('data-location') == "location" ) {
            var id = -1;
            try {
              id = parseInt( $(obj).attr('data-locationid') );
              if (id >= $rootScope.locationListBoolean.length && id > -1) {
                console.log("Error Array out of Index!");
                $(obj).bootstrapToggle('off');
                $(obj).bootstrapToggle('disable');
              } else {
                if ( $rootScope.locationListBoolean[id] ) {
                  $(obj).bootstrapToggle('off');
                } else {
                  $(obj).bootstrapToggle('on');
                }
              }
            } catch (e) {
              $(obj).bootstrapToggle('off');
              $(obj).bootstrapToggle('disable');
            } finally {
              // do nothing
            }
          } else {
            var id = -1;
            try {
              id = parseInt( $(obj).attr('data-locationid') );
              if (id >= $rootScope.personListBoolean.length && id > -1) {
                console.log("Error Array out of Index!");
                $(obj).bootstrapToggle('off');
                $(obj).bootstrapToggle('disable');
              } else {
                if ( $rootScope.personListBoolean[id] ) {
                  $(obj).bootstrapToggle('off');
                } else {
                  $(obj).bootstrapToggle('on');
                }
              }
            } catch (e) {
              $(obj).bootstrapToggle('off');
              $(obj).bootstrapToggle('disable');
            } finally {
              // do nothing
            }
          }
        });
      } else {
        $("#filterButton").html('<i class="fa fa-cog"></i> Open Filter');
        $rootScope.openFilterValue = true;

        $rootScope.directions = !($('#directionsInput').prop('checked'));
        $rootScope.internals = !($('#internalInput').prop('checked'));
        $rootScope.externals = !($('#externalInput').prop('checked'));

        $('.sliderBox').each(function(i, obj) {
          if ( $(obj).attr('data-location') == "location" ) {
            var id = -1;
            try {
              id = parseInt( $(obj).attr('data-locationid') );
              if (id >= $rootScope.locationListBoolean.length && id > -1) {
                console.log("Error Array out of Index!");
                $(obj).bootstrapToggle('off');
                $(obj).bootstrapToggle('disable');
              } else {
                var loctype = $(obj).attr('data-loctype');
                if (loctype == "external") {
                  var generalClass = !($("#externalInput").prop('checked'));
                  var locationType = !($(obj).prop('checked'));
                  //console.log("Analyse: " + generalClass + " | " + locationType + " Result: " + (generalClass || locationType));
                  $rootScope.locationListBoolean[id] = (generalClass || locationType);
                } else if (loctype == "internal") {
                  var generalClass = !($("#internalInput").prop('checked'));
                  var locationType = !($(obj).prop('checked'));
                  //console.log("Analyse: " + generalClass + " | " + locationType + " Result: " + (generalClass || locationType));
                  $rootScope.locationListBoolean[id] = (generalClass || locationType);
                } else {
                  $rootScope.locationListBoolean[id] = !($(obj).prop('checked'));
                }
              }
            } catch (e) {
              console.log("Error while parse int from slider box!");
            } finally {
              // do nothing
            }
          } else {
            var id = -1;
            try {
              id = parseInt( $(obj).attr('data-locationid') );
              if (id >= $rootScope.personListBoolean.length && id > -1) {
                console.log("Error Array out of Index!");
                $(obj).bootstrapToggle('off');
                $(obj).bootstrapToggle('disable');
              } else {
                $rootScope.personListBoolean[id] = !($(obj).prop('checked'));
              }
            } catch (e) {
              console.log("Error while parse int from slider box!");
            } finally {
              // do nothing
            }
          }
        });
      }
    };
});

app.directive('fallbackSrc', function() {
  var fallbackSrc = {
    link: function postLink(scope, iElement, iAttrs) {
      iElement.bind('error', function() {
        angular.element(this).attr("src", iAttrs.fallbackSrc);
      });
    }
  }
  return fallbackSrc;
});
