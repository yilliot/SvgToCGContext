
function main() {
    var bassClefPath = "M64.487,0.305c0.283-0.055,1.564-0.392,1.565-0.08c0,0.52,0,1.041,0,1.561c0,2.186,0,4.371,0,6.556c0,3.66,0,7.322,0,10.982c1.654-1.264,3.906-2.539,5.953-1.354c1.831,1.058,2.534,3.125,1.831,5.124c-0.686,1.945-2.305,3.503-3.844,4.783c-1.978,1.647-3.788,3.324-5.506,4.898c0-10.673,0-21.346,0-32.017C64.487,0.605,64.487,0.455,64.487,0.305 M66.053,29.667c1.738-1.915,4.28-4.351,4.491-7.274c0.092-1.27-0.503-2.761-1.883-2.968c-1.021-0.182-2.196,1.011-2.543,1.87c-0.14,0.349-0.065,0.816-0.065,1.184c0,0.934,0,1.867,0,2.801C66.053,26.741,66.053,28.203,66.053,29.667";
    var sgSvg = new SGSvg();
    var lines = sgSvg.parser(bassClefPath);
    var dots = sgSvg.linesToNormalizeDots(lines);
    var objectiveCLines = sgSvg.dotsToObjectiveCLines(dots);
    sgSvg.writeToObjectiveC(objectiveCLines);
}

var SGSvg = function(){
    this.lastX = 0;
    this.lastY = 0;
    this.normalizeOffSetX = 0;
    this.normalizeOffSetY = 0;
};

SGSvg.prototype.parser = function(svgString) {

    var processedBassClefPath = svgString.replace(/([a-zA-Z])/g,"|$1%");
    processedBassClefPath = processedBassClefPath.replace(/(\d)(-)/g,'$1,$2');
    return processedBassClefPath.split("|");
};

SGSvg.prototype.linesToNormalizeDots = function(lines) {

    var divider = lines[1].split("%");
    var axises = divider[1].split(',');
    this.normalizeOffSetX = 0 - (axises[0]*1);
    this.normalizeOffSetY = 0 - (axises[1]*1);

    var dots = [];
    for(var i in lines) {

        var divider = lines[i].split("%");
        if (divider[0] && divider[1]) {
            var axises = divider[1].split(',');
            var dot = {};
            dot.action = divider[0];

            // relative calc
            if(/[a-y]/.test(dot.action)) {

                // extra attribute
                if (dot.action === 'c') {
                    dot.x1 = this.lastX + (axises[0]*1) + this.normalizeOffSetX;
                    dot.y1 = this.lastY + (axises[1]*1) + this.normalizeOffSetY;
                    dot.x2 = this.lastX + (axises[2]*1) + this.normalizeOffSetX;
                    dot.y2 = this.lastY + (axises[3]*1) + this.normalizeOffSetY;
                    dot.x0 = this.lastX + (axises[4]*1) + this.normalizeOffSetX;
                    dot.y0 = this.lastY + (axises[5]*1) + this.normalizeOffSetY;
                    
                } else {
                    dot.x0 = this.lastX + (axises[0]*1) + this.normalizeOffSetX;
                    dot.y0 = this.lastY + (axises[1]*1) + this.normalizeOffSetY;
                }


            } else if(/[A-Y]/.test(dot.action)) {

                if (dot.action === 'C') {
                    dot.x1 = (axises[0]*1) + this.normalizeOffSetX;
                    dot.y1 = (axises[1]*1) + this.normalizeOffSetY;
                    dot.x2 = (axises[2]*1) + this.normalizeOffSetX;
                    dot.y2 = (axises[3]*1) + this.normalizeOffSetY;
                    dot.x0 = (axises[4]*1) + this.normalizeOffSetX;
                    dot.y0 = (axises[5]*1) + this.normalizeOffSetY;
                } else {
                    dot.x0 = (axises[0]*1) + this.normalizeOffSetX;
                    dot.y0 = (axises[1]*1) + this.normalizeOffSetY;
                }

            } else {
                dot.x0 = 0;
                dot.y0 = 0;
            }

            dot.action = dot.action.toUpperCase();

            this.lastX = dot.x0;
            this.lastY = dot.y0;
            dots.push(dot);
        }
    }
    return dots;
};

SGSvg.prototype.dotsToObjectiveCLines = function(dots) {
    var nPoint = 5;
    var lines = [];
    for(var i in dots) {
        var dot = dots[i];
        if (dot.action === 'M') {
            lines.push('CGContextMoveToPoint(ctx, '+dot.x0.toFixed(nPoint)+'*scaleX, '+dot.y0.toFixed(nPoint)+'*scaleY);');
        } else if (dot.action === 'C') {
            lines.push('CGContextAddCurveToPoint (ctx, '+dot.x1.toFixed(nPoint)+'*scaleX, '+dot.y1.toFixed(nPoint)+'*scaleY, '+dot.x2.toFixed(nPoint)+'*scaleX, '+dot.y2.toFixed(nPoint)+'*scaleY, '+dot.x0.toFixed(nPoint)+'*scaleX, '+dot.y0.toFixed(nPoint)+'*scaleY);');
        } else if (dot.action === 'L') {
            lines.push('CGContextAddLineToPoint(ctx, '+dot.x0.toFixed(nPoint)+'*scaleX, '+dot.y0.toFixed(nPoint)+'*scaleY);');
        } else if (dot.action === 'Z') {
            lines.push(
                "CGContextClosePath (ctx);\n"+
                "    if (fillPath) {\n"+
                "        CGContextFillPath (ctx);\n"+
                "    }\n"+
                "    CGContextStrokePath(ctx);\n"
            );
        }
    }
    return lines;
};

SGSvg.prototype.writeToObjectiveC = function(lines) {
    var result = "-(void) drawRect:(CGRect)rect {\n"+
        "    float scaleX = 0.5;\n"+
        "    float scaleY = 0.5;\n"+
        "    BOOL fillPath = true;\n"+
        "    CGContextRef ctx = UIGraphicsGetCurrentContext();\n"+
        "    if (fillPath) {\n"+
        "        CGContextSetRGBFillColor(ctx, 1.0, 1.0, 1.0, 1.0 );\n"+
        "    }\n"+
        "    CGContextSetRGBStrokeColor(ctx, 1, 1, 1, 1); \n"+
        "    CGContextSetLineWidth(ctx, .5);\n";

    for(var i in lines) {
        result += "    "+lines[i]+"\n";
    }
    result += "}"
    var fs = require('fs');
    fs.writeFile("tmp.m", result , function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
}

main();