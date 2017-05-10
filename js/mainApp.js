var app = angular.module('SecklowApp', [ 
    "ngRoute",
    "ngTouch",
	'selector',
	'ngAudio',
	'ngSanitize',
	"mobile-angular-ui",
	"angular-jqcloud",
	'ngMap', 'chart.js',
	"ng.deviceDetector",
	'matchMedia'
])

.config(function($routeProvider, $locationProvider, ChartJsProvider) {
    $routeProvider.when('/', {
		 templateUrl: "pages/search.html"
    });
	
	$routeProvider.when('/episode', {
	    templateUrl: 'pages/episode.html'
	});
	
	ChartJsProvider.setOptions({ colors : [ '#e9294b', '#302d2f', '#a7a9ac', '#21a3a6', '#818387', '#949FB1', '#4D5360'] });
	
})

angular.module('SecklowApp').filter('randomize', function() {
  return function(input, scope) {
	icons = [ "circles", "flower-of-life","icosahedron" , "metatron-cube", "octahedron" ]
    if (input!=null && input!=undefined && input > 1) {
		return icons[Math.floor((Math.random()*input)+1)];
    }  
  }
});

app.controller('MainController', 
			['$scope', 'screenSize', 'deviceDetector','$http', '$location', 'ngAudio', 'SharedState', 
    function($scope, screenSize, deviceDetector, $http, $location, ngAudio, SharedState,  ngMap) {   
      
	  	if (deviceDetector.os == 'android' ) {
	  		$scope.sms = "sms:+447539509448?body=My%20text%20for%20Secklow%20Sounds";
	  	} else if (deviceDetector.os == 'ios') {
			//works for IOS 5,6
			$scope.sms ="sms:+447539509448&body=My%20text%20for%20Secklow%20Sounds";
	  	} 
		
		$scope.isUnknown = function(){
			if (deviceDetector.device == 'unknown') {
				return true; 
			}
			return false;
		} 
		
		console.log(deviceDetector.os_version);
	  	console.log(deviceDetector.browser);
	  	console.log(deviceDetector.device);

		$scope.colors = ["F5C9C9","EDB3C6","#E59FCA", "#DD8CD5", "#C27AD5", "#9B68CD", "#6E58C5", "#4953BD", "#3A6AB5", "#2D85AD", "#21A3A6"];
		$scope.sms =  "sms:+447539509448?body=My%20text%20for%20Secklow%20Sounds";
		$scope.googleMapsUrl="https://maps.googleapis.com/maps/api/js?key=AIzaSyDEJDKFSDl6ndtqnRykHyahKnoQG_KN_hQ";
		$scope.words = [];
		$scope.info = {};
		$scope.entityInfo = {};
		$scope.dataHubEntities = {};
	    $scope.orderProp = "date"; 
	    $scope.episodeAudio = '';

		$scope.pageCounter = 0 ;
		$scope.episodesDownloads ={};
		
		$scope.desktop = screenSize.on('sm, md, lg', function(match){
		    $scope.desktop = match;
			
		});
		
		$scope.mobile = screenSize.on('xs', function(match){
		    $scope.mobile = match;
		});
				
		 
		$http.get('docs/secklow_ann.json').success(function(data) {
		   $scope.episodes = data;
		}).error(
			function(data){
				console.log("Problem while loading episodes");
			}
		).then( function(){
			console.log('Finished loading episodes');
			$scope.loading = false;
		});
		
		
		
		$scope.loading = true;
		$http.get('./docs/datahub_entities.json').success(function(data) {
		  
		   $scope.dataHubEntities = data;
		   // console.log($scope.dataHubEntities);
		}).error(
			function(data){
				console.log("Problem while loading DH entities");
			}
		).then( function(){
			console.log('Finished loading DH entities');
			$scope.loading = false;
		});
		
		// TODO TEMPorary solution, will be replaced with the new data (containing download url)
		$http.get('./docs/episodes-downloads.csv').success(function(data) {
		  
			var split  = data.split('\n');
			
			for (var i = 0 ; i < split.length ; i++ ){
				var line = split[i].split(','); 
				var podcastName = line[1].split('/')[line[1].split('/').length-1];
				$scope.episodesDownloads[line[0]]=podcastName;
			}
		}).error(
			function(data){
				console.log("Problem while loading podcasts");
			}
		).then( function(){
			console.log('Finished loading podcasts' );
		});
		
		
		$scope.getWidth = function(){
			return 800;
		}
		
 	   $scope.examples = [ "Wolverton", "Milton Keynes", "Fenny Stratford", "Open University",  "Campbell park", 
							"Shenley brook end", "Central milton keynes", "Milton keynes theatre", "Bletchley park", "Cineworld"];	
	   
	  
	   $scope.liveAudio = ngAudio.load("http://31.25.191.64:8000/;stream/1");	   
	   $scope.currentEnt = ""; 

	   $scope.test = function(ex,ix){
		   // TODO this should happen in the html
		   $scope.activeTab = ix;
		   $scope.query = ex;
	   };
		
		
		$scope.playEpisode= function(){	
		
			if (!$scope.liveAudio.paused ){
				$scope.liveAudio.stop();
			}

			 // $scope.episodeAudio  =  ngAudio.load("http://mkinsight.org/secklow-podcasts/"+$scope.episodesDownloads[$scope.currentEpisode.name]);
			console.log($scope.episodeAudio);

			$scope.episodeText = $scope.currentEpisode.title;
			// if ($scope.episodeAudio.paused || $scope.episodeAudio == ''){
// 				$scope.episodeAudio.play();
// 			}

			var isPlaying = $scope.episodeAudio.currentTime > 0 && !$scope.episodeAudio.paused && !$scope.episodeAudio.ended ;
			console.log(isPlaying);

			if (!isPlaying) {
			  $scope.episodeAudio.play();
			} else {
				$scope.episodeAudio.destroy();
				console.log('ooo');
				$scope.episodeAudio  =  ngAudio.load("http://mkinsight.org/secklow-podcasts/"+$scope.episodesDownloads[$scope.currentEpisode.name]);
		   
			}

		}
		
		$scope.pauseEpisode = function(){		
			$scope.episodeAudio.pause();			
		}
		
		$scope.openEpisode= function(epi){
			
			$scope.words = [];
			$scope.currentEpisode = epi;
			
			// console.log($scope.episodesDownloads[$scope.currentEpisode.name]);
			$scope.episodeAudio  =  ngAudio.load("http://mkinsight.org/secklow-podcasts/"+$scope.episodesDownloads[$scope.currentEpisode.name]);
		   
			for (var ent=0; ent < epi.entities.length; ent++){	
				if ($scope.dataHubEntities.hasOwnProperty(epi.entities[ent].text)){
					
					if (epi.entities[ent]['dh'].length > 0  ) {
						epi.entities[ent]['weight'] = 5000;
					} 
					epi.entities[ent]['color'] = '#e9294b';
					epi.entities[ent]['html'] = {class:'fake-link'};
				}
				epi.entities[ent]['text'] = $scope.clean(epi.entities[ent]['text']);
				$scope.words.push(epi.entities[ent]);
			}
			
			console.log($scope.words.length,"words");
			$location.path('/episode');	
		}	
		
		$scope.hasDatahubInfo = function(){
			return Object.keys($scope.entityInfo).length > 0;
		}
		$scope.updateWord= function() {	
			$('#wordcloud').on('click', 'span', function(){	
				$scope.currentEnt = $(this).text();
   			 	$scope.info = $scope.dataHubEntities[$(this).text().split(" ").join("_")];
				
		    }); 
		}
		
		$scope.openInfo= function() {
			
			if ($scope.info == undefined) {return;}
			for (var ix = 0 ; ix < $scope.info.length ; ix++ ){
				var info = populationProjection($scope.info[ix]);
				var coordinates = getCoord($scope.info[ix]);
				var economy = getEconomy($scope.info[ix]);
				var age = getAgeRange($scope.info[ix]);
				var topics = getTopic($scope.info[ix]);
				
				
				if (Object.keys(info.data[0]).length != 0){ // TODO change validity check : returned object should be empty
					$scope.entityInfo['population_projection'] = info; // TODO temporal fix, this overrides!!!
				
				}
				if (coordinates != ""){
					$scope.entityInfo['coordinates'] = coordinates;	
				}
			
				if (Object.keys(economy.data[0]).length != 0) {
					$scope.entityInfo['economy'] = economy;	
					
				}
			
				if (Object.keys(age.data[0]).length != 0) {
					$scope.entityInfo['age'] = age;	
				}
				
				if (topics.length != 0) {
					$scope.entityInfo['photos'] = topics;	
				}
				
				var otherPossibleProp = ["Name","BusinessName","BusinessType","phone","RatingValue","AddressLine1","AddressLine2"];
				
				for (var propix = 0 ; propix < otherPossibleProp.length ; propix++){
					addOtherProperty($scope.info[ix], otherPossibleProp[propix]);
				} 
			}
				

		}
	  
		$scope.$watch(function () {
		        return SharedState.get('event');
		  }, function (newValue) {  	
		        console.log('open modal: ' + newValue);
		 });
		 
	
			
		$scope.home = function(){
			$scope.query ="";
			$scope.currentEpisode = {};
			$location.path('/');
		}
		
		// PRIVATE FUNCTIONS
		
		function getTopic(entity){
			
			var photoObject = [];
			if (entity != undefined && entity.hasOwnProperty("global:topicOfPhoto")){
				var photos = entity["global:topicOfPhoto"];
				var max = photos.length < 12 || 12;  
				for (var photoIx = 0 ; photoIx < max; photoIx++ ){
					if (photos[photoIx].hasOwnProperty('global:thumbnail') ){
							photoObject.push({ thumbnail : photos[photoIx]['global:thumbnail'][0], 
												url: photos[photoIx]['social:url'][0],
												alt: photos[photoIx]['dc:title'][0]
											});
							if (photos[photoIx].hasOwnProperty('dc:description')){
								photoObject[photoIx]['desc'] = photos[photoIx]['dc:description'][0];
							}
					}
				}
			}
			return photoObject;
		}
		
		function getEconomy(entity){
			var eco = { 
				data : [[]], 
				labels: [] ,
				options: { 
					scales : {
						xAxes : [
							{
								stacked: true  ,
								barThickness : 20
							}
						],
						yAxes : [
							{
								stacked: true  
							}
						]
					}
				}		
			};
			var occupations = [ "global:elementary_occupations", "global:caring_leisure_and_other_service_occupations", "global:process_plant_and_machine_operatives", "global:associate_professional_and_technical_occupations", "global:professional_occupations","global:skilled_trades_occupations", "global:managers_directors_and_senior_officials", "global:sales_and_customer_service_occupations", "global:administrative_and_secretarial_occupations"];
			
			if (entity.hasOwnProperty("global:economy")){
				// it's an array
				for (var item = 0 ; item < entity["global:economy"].length; item++){
					// check if it is census 2011
					if (entity["global:economy"][item][Object.keys(entity['global:economy'][item])[0]][0].hasOwnProperty("global:census_2011")){
						occups = Object.keys(entity["global:economy"][item]);
						for (var occ = 0; occ < occups.length; occ++ ){
							if (occupations.indexOf(occups[occ]) > -1 ) {
								eco.labels.push($scope.noGlobal(occups[occ]).replace("_occupations","").replace("_in_employment",""));
								eco.data[0].push(entity["global:economy"][item][occups[occ]][0]["global:census_2011"][0]);
							}
						}
					}

				}
			}
			return eco;
		}
	
		
		function getCoord(entity){
			if (entity.hasOwnProperty("geo:lat") && entity.hasOwnProperty("geo:long")  ){			
				return "["+entity["geo:lat"][0]+","+entity["geo:long"][0]+"]";
			} else if (entity.hasOwnProperty("geo:latitude") && entity.hasOwnProperty("geo:longitude")  ){
				return "["+entity["geo:latitude"][0]+","+entity["geo:longitude"][0]+"]";
			} else {
				return "";
			}
		}
		
		
		function getAgeRange(entity){
			var age = {data : [[]], labels: [] };
			// console.log(entity);
			if ( entity.hasOwnProperty("global:population")){
				
				for (var item = 0 ; item < entity["global:population"].length; item++){
					if (entity["global:population"][item].hasOwnProperty("global:age_range") 
						 && entity["global:population"][item]["global:age_range"][0].hasOwnProperty("global:census_2011")
						){
							ages = Object.keys(entity["global:population"][item]["global:age_range"][0]["global:census_2011"][0]).sort();
							// console.log(ages);
							for (var i = 0; i < ages.length; i++ ){
								// console.log(ages[i],entity["global:population"][item]["global:age_range"][0]["global:census_2011"][0][ages[i]]);
								age['labels'].push($scope.noGlobal(ages[i]).replace("age_",""));
								age['data'][0].push(entity["global:population"][item]["global:age_range"][0]["global:census_2011"][0][ages[i]][0]);
							}
							
					}
				}
			}
			return age;
		}
				
		
		function populationProjection(entityInfo){
			
			var info = { data : [[]], labels: [] };
			if ( entityInfo.hasOwnProperty("global:populationProjection")){
				
				var yearProjection = entityInfo["global:populationProjection"][0];
				var keys =  Object.keys(yearProjection).sort();
				
				for (var item = 0 ; item < keys.length; item++){
					
					info['labels'].push($scope.noGlobal(keys[item]).replace("year:",""));
					info['data'][0].push(yearProjection[keys[item]][0]);
	
		
				}	
			}
			
			return info;
		}
		
		function addOtherProperty(object, propertykey){
			if (object.hasOwnProperty("global:"+propertykey)){
				$scope.entityInfo[propertykey] = { 'other': true};
				$scope.entityInfo[propertykey]['value'] = object["global:"+propertykey][0] ; 
				
			}
		}

		
		// UTILITY FUNCTIONS
		
		$scope.nextPages = function(){
			$scope.pageCounter= $scope.pageCounter+10;
			console.log($scope.pageCounter);
		}
		
		$scope.previousPages = function(){
			$scope.pageCounter = $scope.pageCounter-10;
			console.log($scope.pageCounter);
		}
		
		$scope.reset = function(){
			$scope.currentEnt = "";
			$scope.entityInfo = {};
			$scope.info = {};
		}
		
		

		$scope.noGlobal = function(word){
			return word.replace("global:", "");
		}
		
		$scope.limit = function(mystring){
			if (mystring != undefined) {
				return mystring.substring(0,20)+" [...]";
			} else {
				return "No description";
			}
		}
		
		$scope.clean = function(word){	
			return word.split("_").join(" ");
		}
	
		$scope.revert = function(inputDate) {
			if (inputDate == undefined ) {
				return inputDate;
			}
			var date = inputDate.split(" ")[0];
			return date.split("-")[2]+"/"+date.split("-")[1]+"/"+date.split("-")[0];
		}
		
	}
]);