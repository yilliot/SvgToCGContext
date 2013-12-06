Helper = function(){

}

Helper.prototype.roundToFive = function(number) {
    var multiple = Math.pow(10, 5);
    return Math.round(number * multiple) / multiple;
}

exports.Helper = Helper;