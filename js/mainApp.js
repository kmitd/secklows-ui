var app = angular.module('SecklowApp', [
    "ngRoute",
    "ngTouch",
    "mobile-angular-ui"
]);

app.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
       // templateUrl: "pages/episodes.html"
		 templateUrl: "pages/search.html"
    });
	
	$routeProvider.when('/episode', {
	    templateUrl: 'pages/episode.html'
	});
	
});




app.controller('MainController', ['$scope',  '$http', '$location',
    function($scope, $http, $location) {   
      
	    $scope.orderProp = "name"; 
		
		$http.get('docs/secklow_ann.json').success(function(data) {
		   $scope.episodes = data;
		});
		
		
		
		// this does not show episodes with no entities
		// TODO use angular for this
		$scope.filterFct = function(epi){
			var size = 0;
			for (key in epi.entities){
				size++;
			}
			 // console.log(size, epi.name);
			if (size > 1) {
				return true;  
			} 
			else {
				return false;
			} 
		}
	
		$scope.openEpisode= function(epi){
			$scope.currentEpisode = epi;	
			console.log(epi);
			$location.path('/episode');	
		}	
		
		$scope.home = function(){
			$location.path('/');
		}
    }
]);