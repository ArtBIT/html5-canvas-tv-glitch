var CanvasGlitch = (function() {
    if (window['PerlinNoise'] === undefined) {
        throw new Error('Please include perlin-noise.js');
    }
    var generator = new PerlinNoise();
    function noise(x, y, z) {
        var effect = 1, 
            k = 1, 
            sum = 0, 
            octaves = 4, 
            fallout = 4.5;

        for (var i=0; i < octaves; ++i) {
            effect *= fallout;
            switch (arguments.length) {
                case 1:
                    sum += effect * (1 + generator.noise1d(k*x))/2;
                    break;
                case 2:
                    sum += effect * (1 + generator.noise2d(k*x, k*y))/2;
                    break;
                case 3:
                    sum += effect * (1 + generator.noise3d(k*x, k*y, k*z))/2; 
                    break;
            }
            k *= 2;
        }
        return sum;
    };

    function Glitch(canvas_node) {
        this.canvas = canvas_node;
        this.ctx = this.canvas.getContext('2d');

        // keep a copy of the original contents of the canvas
        this.image_data = this.ctx.getImageData(0,0,canvas_node.width, canvas_node.height);
        this.width  = this.image_data.width;
        this.height = this.image_data.height;

        this.yoffset = 0;
        this.time = 0;

        var that = this;

        // This shader uses perlin noise generator function to offset the screen horizontally
        var tvInterference = function(r, g, b, a, x, y, w, h) {
            var iy = ((y+that.yoffset)|0) % that.height;
            var ix = (x+(noise(y/that.height, that.time)|0)) % that.width;
            idx = (iy * that.width + ix) * 4;
            var px = that.image_data.data;
            return {
                r: px[idx + 0],
                g: px[idx + 1],
                b: px[idx + 2],
                a: px[idx + 3]
            }
        }
        // This shader applies simple color noise to the channel values
        var tvStatic = function(r, g, b, a, x, y, w, h) {
            var v = (Math.random()*32) | 0;
            return {
                r: (r+v),
                g: (g+v),
                b: (b+v),
                a: a
            }
        }

        // shader will be a function that transforms input [r, g, b, a] channel values of the each pixel
        this.applyShader = function(shader) {
            var w = this.width;
            var h = this.height;

            var context = this.canvas.getContext('2d');
            var imageData = context.getImageData(0, 0, w, h);

            for (var i = 0, k = 0, l = imageData.data.length; i < l; i += 4, k++) {
                var x = k % w;
                var y = (k / w) | 0;

                var r = imageData.data[i + 0];
                var g = imageData.data[i + 1];
                var b = imageData.data[i + 2];
                var a = imageData.data[i + 3];

                var pixel = shader(r, g, b, a, x, y, w, h);

                imageData.data[i ] = pixel.r;
                imageData.data[i + 1] = pixel.g;
                imageData.data[i + 2] = pixel.b;
                imageData.data[i + 3] = pixel.a;
            }

            context.putImageData(imageData, 0, 0);
        };

        // called on each frame
        this.update = function(seconds_elapsed) {
            var dt = seconds_elapsed/1000;
            this.time += dt;
            this.yoffset += dt*50;
        }
        this.render = function() {
            this.applyShader(tvInterference);
            this.applyShader(tvStatic);
        }
        this.reset = function() {
            this.ctx.putImageData(this.image_data,0,0);
        }
    }
    return Glitch;
})();

