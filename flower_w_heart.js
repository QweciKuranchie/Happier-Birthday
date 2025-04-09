window.addEventListener("load", () => {
  // Remove the "container" class from the body
  document.body.classList.remove("container");

  // Initial canvas resize using the correct canvas id "c"
  resizeCanvas();

  // Auto-play the background music
  playAudio();
});

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  const canvas = document.getElementById("c");
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}



function playAudio() {
  const audio = document.getElementById("bgMusic");
  if (audio) {
    audio.volume = 0.3; // Set volume to 30%
    audio.play().catch(error => {
      console.log("Autoplay prevented - click anywhere to start music");
      document.body.addEventListener("click", () => audio.play());
    });
  }
}



document.addEventListener("DOMContentLoaded", () => {
  const h1 = document.querySelector("h1");
  // Hide the h1 element so it doesn't appear on the page,
  // but its text will be used for the animation.
  h1.style.visibility = "hidden";

  const canvas = document.getElementById("c");
  canvas.style.position = "fixed";
  canvas.style.left = "0px";
  canvas.style.top = "0px";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "2";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Get the text lines from h1
  const lines = h1.innerHTML.trim().split("<br>");

  // Set options for the animated fireworks.
  // We make the letters big by increasing charSize,
  // and reduce spacing to better center the text.
  let opts = {
    strings:   lines ,
    charSize: 35
   ,    // Big letters
    charSpacing: 40, // Reduced spacing between letters
    lineHeight: 45,
    // These will be updated below for centering.
    cx: 0,
    cy: 0,
    fireworkPrevPoints: 10,
    fireworkBaseLineWidth: 5,
    fireworkAddedLineWidth: 8,
    fireworkSpawnTime: 200,
    fireworkBaseReachTime: 30,
    fireworkAddedReachTime: 30,
    fireworkCircleBaseSize: 20,
    fireworkCircleAddedSize: 10,
    fireworkCircleBaseTime: 30,
    fireworkCircleAddedTime: 30,
    fireworkCircleFadeBaseTime: 10,
    fireworkCircleFadeAddedTime: 5,
    fireworkBaseShards: 5,
    fireworkAddedShards: 5,
    fireworkShardPrevPoints: 3,
    fireworkShardBaseVel: 4,
    fireworkShardAddedVel: 2,
    fireworkShardBaseSize: 3,
    fireworkShardAddedSize: 3,
    gravity: 0.1,
    upFlow: -0.1,
    letterContemplatingWaitTime: 360,
    balloonSpawnTime: 20,
    balloonBaseInflateTime: 10,
    balloonAddedInflateTime: 10,
    balloonBaseSize: 20,
    balloonAddedSize: 20,
    balloonBaseVel: 0.4,
    balloonAddedVel: 0.4,
    balloonBaseRadian: -(Math.PI / 2 - 0.5),
    balloonAddedRadian: -1
  };

  // Calculate total width of the longest line and center the text.
  const totalWidth = opts.charSpacing * Math.max(...opts.strings.map(s => s.length));
  const offsetX = (canvas.width - totalWidth) / 2;
  const offsetY = (canvas.height - (opts.strings.length * opts.lineHeight)) / 2;
  opts.cx = offsetX + totalWidth / 2;
  opts.cy = offsetY + (opts.strings.length * opts.lineHeight) / 2;

  let w = canvas.width,
      h = canvas.height,
      ctx = canvas.getContext("2d"),
      calc = { totalWidth: totalWidth },
      Tau = Math.PI * 2,
      TauQuarter = Tau / 4,
      letters = [];

  ctx.font = opts.charSize + "px Verdana";

  function Letter(char, x, y) {
    this.char = char;
    // Use computed offsetX and offsetY to position letters in the center
    this.x = x + offsetX;
    this.y = y + offsetY;
    this.dx = -ctx.measureText(char).width / 2;
    this.dy = opts.charSize / 2;
    this.fireworkDy = this.y - opts.cy;
    var hue = x / calc.totalWidth * 360;
    this.color = "hsl(" + hue + ",80%,50%)";
    this.lightAlphaColor = "hsla(" + hue + ",80%,light%,alp)";
    this.lightColor = "hsl(" + hue + ",80%,light%)";
    this.alphaColor = "hsla(" + hue + ",80%,50%,alp)";
    this.reset();
  }

  Letter.prototype.reset = function() {
    this.phase = "firework";
    this.tick = 0;
    this.spawned = false;
    this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0;
    this.reachTime = opts.fireworkBaseReachTime + ((opts.fireworkAddedReachTime * Math.random()) | 0);
    this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
    this.prevPoints = [[0, opts.cy, 0]];
  };

  Letter.prototype.step = function() {
    if (this.phase === "firework") {
      if (!this.spawned) {
        ++this.tick;
        if (this.tick >= this.spawningTime) {
          this.tick = 0;
          this.spawned = true;
        }
      } else {
        ++this.tick;
        var linearProportion = this.tick / this.reachTime,
            armonicProportion = Math.sin(linearProportion * TauQuarter),
            x = linearProportion * this.x,
            y = opts.cy + armonicProportion * (this.y - opts.cy);
        if (this.prevPoints.length > opts.fireworkPrevPoints)
          this.prevPoints.shift();
        this.prevPoints.push([x, y, linearProportion * this.lineWidth]);
        var lineWidthProportion = 1 / (this.prevPoints.length - 1);
        for (var i = 1; i < this.prevPoints.length; ++i) {
          var point = this.prevPoints[i],
              point2 = this.prevPoints[i - 1];
          ctx.strokeStyle = this.alphaColor.replace("alp", i / this.prevPoints.length);
          ctx.lineWidth = point[2] * lineWidthProportion * i;
          ctx.beginPath();
          ctx.moveTo(point[0], point[1]);
          ctx.lineTo(point2[0], point2[1]);
          ctx.stroke();
        }
        if (this.tick >= this.reachTime) {
          this.phase = "contemplate";
          this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
          this.circleCompleteTime = opts.fireworkCircleBaseTime + ((opts.fireworkCircleAddedTime * Math.random()) | 0);
          this.circleCreating = true;
          this.circleFading = false;
          this.circleFadeTime = opts.fireworkCircleFadeBaseTime + ((opts.fireworkCircleFadeAddedTime * Math.random()) | 0);
          this.tick = 0;
          this.tick2 = 0;
          this.shards = [];
          var shardCount = opts.fireworkBaseShards + ((opts.fireworkAddedShards * Math.random()) | 0),
              angle = Tau / shardCount,
              cos = Math.cos(angle),
              sin = Math.sin(angle),
              x = 1,
              y = 0;
          for (var i = 0; i < shardCount; ++i) {
            var x1 = x;
            x = x * cos - y * sin;
            y = y * cos + x1 * sin;
            this.shards.push(new Shard(this.x, this.y, x, y, this.alphaColor));
          }
        }
      }
    } else if (this.phase === "contemplate") {
      ++this.tick;
      if (this.circleCreating) {
        ++this.tick2;
        var proportion = this.tick2 / this.circleCompleteTime,
            armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;
        ctx.beginPath();
        ctx.fillStyle = this.lightAlphaColor.replace("light", 50 + 50 * proportion).replace("alp", proportion);
        ctx.arc(this.x, this.y, armonic * this.circleFinalSize, 0, Tau);
        ctx.fill();
        if (this.tick2 > this.circleCompleteTime) {
          this.tick2 = 0;
          this.circleCreating = false;
          this.circleFading = true;
        }
      } else if (this.circleFading) {
        ctx.fillStyle = this.lightColor.replace("light", 70);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        ++this.tick2;
        var proportion = this.tick2 / this.circleFadeTime,
            armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;
        ctx.beginPath();
        ctx.fillStyle = this.lightAlphaColor.replace("light", 100).replace("alp", 1 - armonic);
        ctx.arc(this.x, this.y, this.circleFinalSize, 0, Tau);
        ctx.fill();
        if (this.tick2 >= this.circleFadeTime)
          this.circleFading = false;
      } else {
        ctx.fillStyle = this.lightColor.replace("light", 70);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
      }
      for (var i = 0; i < this.shards.length; ++i) {
        this.shards[i].step();
        if (!this.shards[i].alive) {
          this.shards.splice(i, 1);
          i--;
        }
      }
      if (this.tick > opts.letterContemplatingWaitTime) {
        this.phase = "balloon";
        this.tick = 0;
        this.spawning = true;
        this.spawnTime = (opts.balloonSpawnTime * Math.random()) | 0;
        this.inflating = false;
        this.inflateTime = opts.balloonBaseInflateTime + ((opts.balloonAddedInflateTime * Math.random()) | 0);
        this.size = opts.balloonBaseSize + opts.balloonAddedSize * Math.random();
        var rad = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random(),
            vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
        this.vx = Math.cos(rad) * vel;
        this.vy = Math.sin(rad) * vel;
      }
    } else if (this.phase === "balloon") {
      ctx.strokeStyle = this.lightColor.replace("light", 80);
      if (this.spawning) {
        ++this.tick;
        ctx.fillStyle = this.lightColor.replace("light", 70);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        if (this.tick >= this.spawnTime) {
          this.tick = 0;
          this.spawning = false;
          this.inflating = true;
        }
      } else if (this.inflating) {
        ++this.tick;
        var proportion = this.tick / this.inflateTime,
            x = this.cx = this.x,
            y = this.cy = this.y - this.size * proportion;
        ctx.fillStyle = this.alphaColor.replace("alp", proportion);
        ctx.beginPath();
        generateBalloonPath(x, y, this.size * proportion);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, this.y);
        ctx.stroke();
        ctx.fillStyle = this.lightColor.replace("light", 70);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        if (this.tick >= this.inflateTime) {
          this.tick = 0;
          this.inflating = false;
        }
      } else {
        this.cx += this.vx;
        this.cy += this.vy += opts.upFlow;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        generateBalloonPath(this.cx, this.cy, this.size);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.cx, this.cy);
        ctx.lineTo(this.cx, this.cy + this.size);
        ctx.stroke();
        ctx.fillStyle = this.lightColor.replace("light", 70);
        ctx.fillText(this.char, this.cx + this.dx, this.cy + this.dy + this.size);
        if (this.cy + this.size < 0 || this.cx < 0 || this.cy > h)
          this.phase = "done";
      }
    }
  };

  function Shard(x, y, vx, vy, color) {
    var vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
    this.vx = vx * vel;
    this.vy = vy * vel;
    this.x = x;
    this.y = y;
    this.prevPoints = [[x, y]];
    this.color = color;
    this.alive = true;
    this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
  }

  Shard.prototype.step = function() {
    this.x += this.vx;
    this.y += this.vy += opts.gravity;
    if (this.prevPoints.length > opts.fireworkShardPrevPoints)
      this.prevPoints.shift();
    this.prevPoints.push([this.x, this.y]);
    var lineWidthProportion = this.size / this.prevPoints.length;
    for (var k = 0; k < this.prevPoints.length - 1; k++) {
      var point = this.prevPoints[k],
          point2 = this.prevPoints[k + 1];
      ctx.strokeStyle = this.color.replace("alp", k / this.prevPoints.length);
      ctx.lineWidth = k * lineWidthProportion;
      ctx.beginPath();
      ctx.moveTo(point[0], point[1]);
      ctx.lineTo(point2[0], point2[1]);
      ctx.stroke();
    }
  };

  function generateBalloonPath(x, y, size) {
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - size / 2, y - size, x - size, y + size / 3, x, y - size);
    ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size, x, y);
  }

  // Create letters based on the text lines from the h1 element.
  for (var i = 0; i < opts.strings.length; i++) {
    var str = opts.strings[i];
    for (var j = 0; j < str.length; j++) {
      letters.push(new Letter(str[j], j * opts.charSpacing, i * opts.lineHeight));
    }
  }

  (function animate() {
    ctx.clearRect(0, 0, w, h);
    letters.forEach(letter => {
      if (letter.phase !== "done") letter.step();
    });
    // Reset letters when all are done so the animation repeats continuously
    if (letters.every(letter => letter.phase === "done")) {
      letters.forEach(letter => letter.reset());
    }
    requestAnimationFrame(animate);
  })();
});
 