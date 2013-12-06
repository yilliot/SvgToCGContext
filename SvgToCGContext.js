var HelperModule = require('./Helper');
var helper = new HelperModule.Helper();

var SGSvg = function(i){
    this.maxX = 0;
    this.maxY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.offsetX = 1000;
    this.offsetY = 1000;
    this.nPoint = 5;
    this.extra = 1.5;
    this.path = i;
};

SGSvg.prototype.parser = function(svgString) {

    var processedBassClefPath = svgString.replace(/([a-zA-Z])/g,"|$1%");
    processedBassClefPath = processedBassClefPath.replace(/(\d)(-)/g,'$1,$2');
    return processedBassClefPath.split("|");
};

SGSvg.prototype.linesToNormalizeDots = function(lines) {

    var dots = [];
    for(var i in lines) {

        var divider = lines[i].split("%");
        if (divider[0] && divider[1]) {
            $this = this;
            var axises = [];
            divider[1].split(',').forEach(function(val,index){
                var scales = [];
                scales['bassClef'] = 0.85;

                if (typeof(scales[$this.path]) !== 'undefined') {
                    axises.push(val * scales[$this.path]);
                } else {
                    axises.push(val);
                }
            });

            var dot = {};
            dot.action = divider[0];

            // relative calc
            if(/[a-y]/.test(dot.action)) {

                // extra attribute
                if (dot.action === 'c') {
                    dot.x1 = this.lastX + (axises[0]*1);
                    dot.y1 = this.lastY + (axises[1]*1);
                    dot.x2 = this.lastX + (axises[2]*1);
                    dot.y2 = this.lastY + (axises[3]*1);
                    dot.x0 = this.lastX + (axises[4]*1);
                    dot.y0 = this.lastY + (axises[5]*1);
                    
                } else {
                    dot.x0 = this.lastX + (axises[0]*1);
                    dot.y0 = this.lastY + (axises[1]*1);
                }


            } else if(/[A-Y]/.test(dot.action)) {

                if (dot.action === 'C') {
                    dot.x1 = (axises[0]*1);
                    dot.y1 = (axises[1]*1);
                    dot.x2 = (axises[2]*1);
                    dot.y2 = (axises[3]*1);
                    dot.x0 = (axises[4]*1);
                    dot.y0 = (axises[5]*1);
                } else if (dot.action === 'V') {
                    dot.x0 = this.lastX;
                    dot.y0 = (axises[1]*1);
                } else {
                    dot.x0 = (axises[0]*1);
                    dot.y0 = (axises[1]*1);
                }

            } else {
                if (dot.action.toUpperCase()!=='Z') {
                    throw dot.action+' not handle';
                }
                dot.x0 = 0;
                dot.y0 = 0;
            }

            dot.action = dot.action.toUpperCase();

            if (dot.action.toUpperCase()!=='Z') {
                if (this.maxX < dot.x0) {
                    this.maxX = dot.x0;
                }
                if (this.maxY < dot.y0) {
                    this.maxY = dot.y0;
                }
                if (this.offsetX > dot.x0) {
                    this.offsetX = dot.x0;
                }
                if (this.offsetY > dot.y0) {
                    this.offsetY = dot.y0;
                }
            }

            this.lastX = dot.x0;
            this.lastY = dot.y0;
            dots.push(dot);
        }
    }
    return dots;
};

SGSvg.prototype.dotsToObjectiveCLines = function(dots) {
    this.offsetX = helper.roundToFive(this.offsetX) - this.extra;
    this.offsetY = helper.roundToFive(this.offsetY) - this.extra;
    var lines = [];
    for(var i in dots) {
        var dot = dots[i];
        if (dot.action === 'M') {
            lines.push('CGContextMoveToPoint(ctx, [self scale:'+helper.roundToFive(dot.x0-this.offsetX)+'], [self scale:'+helper.roundToFive(dot.y0-this.offsetY)+']);');
        } else if (dot.action === 'C') {
            lines.push('CGContextAddCurveToPoint (ctx, [self scale:'+helper.roundToFive(dot.x1-this.offsetX)+'], [self scale:'+helper.roundToFive(dot.y1-this.offsetY)+'], [self scale:'+helper.roundToFive(dot.x2-this.offsetX)+'], [self scale:'+helper.roundToFive(dot.y2-this.offsetY)+'], [self scale:'+helper.roundToFive(dot.x0-this.offsetX)+'], [self scale:'+helper.roundToFive(dot.y0-this.offsetY)+']);');
        } else if (dot.action === 'L') {
            lines.push('CGContextAddLineToPoint(ctx, [self scale:'+helper.roundToFive(dot.x0-this.offsetX)+'], [self scale:'+helper.roundToFive(dot.y0-this.offsetY)+']);');
        } else if (dot.action === 'Z') {
            // lines.push(
            //     "CGContextClosePath (ctx);\n"+
            //     "    if (fillPath) {\n"+
            //     "        CGContextEOFillPath(ctx);\n"+
            //     "    }\n"+
            //     "    CGContextStrokePath(ctx);\n"
            // );
        }
    }
    lines.push(
        "CGContextClosePath (ctx);\n"+
        "    CGContextEOFillPath(ctx);\n"+
        "    //CGContextStrokePath(ctx);\n"
    );
    return lines;
};

SGSvg.prototype.writeToObjectiveC = function(lines) {
    this.maxX += this.extra;
    this.maxY += this.extra;
    var result = "\n"+
        "@synthesize scale = _scale;\n"+
        "- (id)initWithX:(CGFloat)x y:(CGFloat)y scale:(CGFloat)s\n"+
        "{\n"+
        "    self = [self initWithFrame:CGRectMake(x, y, s * "+helper.roundToFive(this.maxX-this.offsetX)+", s * "+helper.roundToFive(this.maxY-this.offsetY)+")];\n"+
        "    if (self) {\n"+
        "        [self setBackgroundColor:[UIColor colorWithWhite:0 alpha:0]];\n"+
        "        self.scale = s;\n"+
        "    }\n"+
        "    return self;\n"+
        "}\n\n"+
        "- (id)initWithFrame:(CGRect)frame\n"+
        "{\n"+
        "    self = [super initWithFrame:frame];\n"+
        "    if (self) {\n"+
        "    }\n"+
        "    return self;\n"+
        "}\n\n"+
        "-(void) drawRect:(CGRect)rect {\n"+
        "    CGContextRef ctx = UIGraphicsGetCurrentContext();\n"+
        "    CGContextSetRGBFillColor(ctx, 0, 0, 0, 1 );\n"+
        "    //CGContextSetRGBStrokeColor(ctx, 1, 1, 1, 1); \n"+
        "    CGContextSetLineWidth(ctx, 1);\n";

    for(var i in lines) {
        result += "    "+lines[i]+"\n";
    }
    result += "}\n\n";
    result += "-(CGFloat)scale:(CGFloat)s {\n";
    result += "    return s * self.scale;\n";
    result += "}\n\n";
    result += "@end";
    return result;
};

SGSvg.prototype.writeObjectiveCToFile = function(content, filename) {
    var fs = require('fs');
    fs.writeFile('objectiveC/'+filename+".m", content , function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
}

exports.SGSvg = SGSvg;