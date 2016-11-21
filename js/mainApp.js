var app = angular.module('SecklowApp', [ 
    "ngRoute",
    "ngTouch",
	'selector',
	'ngAudio',
	"mobile-angular-ui"])

.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
       // templateUrl: "pages/episodes.html"
		 templateUrl: "pages/search.html"
    });
	
	$routeProvider.when('/episode', {
	    templateUrl: 'pages/episode.html'
	});
	
});


app.controller('MainController', ['$scope',  '$http', '$location', 'ngAudio',
    function($scope, $http, $location, ngAudio) {   
      
	  
	    $scope.orderProp = "name"; 
		
		$http.get('docs/secklow_ann.json').success(function(data) {
		   $scope.episodes = data;
		});
		
		$http.get('docs/entities.json').success(function(data) {
			$scope.entities = data;

		});
		
 	   $scope.examples = [ "Ed Sheeran", "Milton Keynes", "Fenny_Stratford", "Open_University"];	
	   
	   
	   $scope.audio = ngAudio.load("http://31.25.191.64:8000/;stream/1");
	   
	
	   

	   
	   $scope.test = function(ex,ix){
		   // TODO this should happen in the html
		   $scope.activeTab = ix;
		   $scope.query = ex;
	   };
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