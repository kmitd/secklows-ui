var app = angular.module('SecklowApp', [ 
    "ngRoute",
    "ngTouch",
	'selector',
	'ngAudio',
	'ngSanitize',
	"mobile-angular-ui",
	"angular-jqcloud",
	'ngMap', 'chart.js'
])

.config(function($routeProvider, $locationProvider, ChartJsProvider) {
    $routeProvider.when('/', {
		 templateUrl: "pages/search.html"
    });
	
	$routeProvider.when('/episode', {
	    templateUrl: 'pages/episode.html'
	});
	
	ChartJsProvider.setOptions({ colors : [ '#803690', '#00ADF9', '#DCDCDC', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360'] });
	
})


app.controller('MainController', ['$scope',  '$http', '$location', 'ngAudio', 'SharedState', 
    function($scope, $http, $location, ngAudio, SharedState,ngMap) {   
      
	 
 
		$scope.googleMapsUrl="https://maps.googleapis.com/maps/api/js?key=AIzaSyDEJDKFSDl6ndtqnRykHyahKnoQG_KN_hQ";
		$scope.words = [];
		$scope.info = {};
		$scope.entityInfo = {};
		$scope.dataHubEntities = {};
	    $scope.orderProp = "name"; 
		
		$http.get('docs/secklow_ann.json').success(function(data) {
		   $scope.episodes = data;
		   
		}).error(
			function(data){
				console.log("uups loading issue");
			}
		);
		
		$scope.loading = true;
		$http.get('./docs/datahub_entities.json').success(function(data) {
		  
		   $scope.dataHubEntities = data;
		   // console.log($scope.dataHubEntities);
		}).error(
			function(data){
				console.log("uups loading issue");
			}
		).then( function(){
			console.log('Finished loading');
			$scope.loading = false;
		});
		
		
		
 	   $scope.examples = [ "Wolverton", "Milton Keynes", "Fenny_Stratford", "Open_University",  "Campbell_park", 
							"Shenley_brook_end", "Central_milton_keynes", "Milton_keynes_theatre", "Bletchley_park", "Cineworld"];	
	   
	   
	   $scope.audio = ngAudio.load("http://31.25.191.64:8000/;stream/1");
	   
	   $scope.currentEnt = ""; 

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
			if (size > 1) {
				return true;  
			} 
			else {
				return false;
			} 
		}
		
		
		$scope.openEpisode= function(epi){
			$scope.words = [];
			$scope.currentEpisode = epi;
			for (var ent=0; ent < epi.entities.length; ent++){
				// if (epi.entities[ent]['dh'].length > 0  ){
				
				if ($scope.dataHubEntities.hasOwnProperty(epi.entities[ent].text)){
					
					if (epi.entities[ent]['dh'].length > 0  ) {
						epi.entities[ent]['weight'] = 5000;
						
						// console.log(epi.entities[ent]);
					} 
					epi.entities[ent]['color'] = 'green';
					
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
			$location.path('/');
		}
		
		
		function getTopic(entity){
			
			var photoObject = [];
			console.log(entity);
			if (entity != undefined && entity.hasOwnProperty("global:topicOfPhoto")){
				var photos = entity["global:topicOfPhoto"];
				console.log(photos);
				var max = photos.length < 12 || 12;  
				for (var photoIx = 0 ; photoIx < max; photoIx++ ){
					console.log(photos[photoIx]);
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
	
		
		
	}
]);