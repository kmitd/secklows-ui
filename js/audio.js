angular
  .module('angular-audio-visualizer', [])
  .controller('AudioVisualizerCtrl', ['$timeout', '$scope', 
    function($timeout, $scope) {

      function getAverages(parts) {
        var total = 0;

        for(var i=0; i<parts.length; i++) {
          total += parts[i];
        }

        return total / parts.length;
      }

      function percentVolume(val) {
        return  (val / 180) * 100;// max amplitude?
      }

      function splitArr(freqs, barCount) {
        barCount = 8; // temp
        var arrCount = freqs.length / barCount;
        var bars = [];

        for(var i=0; i<barCount; i++) {
          bars[i] = getAverages(freqs.slice(i * arrCount, i * arrCount + arrCount));
          bars[i] = percentVolume(bars[i]);
        }

        return bars;
      }

      var audio;

      function loadAudio() {

        audio = document.getElementById($scope.audioSrcId);

        var ctx = new AudioContext();
        var audioSrc = ctx.createMediaElementSource(audio);
        var analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;

        audioSrc.connect(analyser);
        audioSrc.connect(ctx.destination);
       
        var frequencyData = new Uint8Array(analyser.frequencyBinCount);
       
        function renderFrame() {
           requestAnimationFrame(renderFrame);
           analyser.getByteFrequencyData(frequencyData);

          $timeout(function() {
            $scope.bars = splitArr(frequencyData);
          });
        }

        audio.play();
        renderFrame();

      }

      loadAudio();

    }
  ])
  .directive('audioVisualizer', function() {
    return {
      controller: 'AudioVisualizerCtrl',
      controllerAs: 'vm',
      scope: {
        audioSrcId: '@'
      },
      template: '\
        <div class="bars">\
          <div ng-repeat="bar in bars track by $index">\
            <div style="height: {{bar}}%"></div>\
          </div>\
        </div>\
        <br />\
        <br />\
      '
    }
  })