// jQuery ArrowMark Ver 1.02 By Akinori Kawai http://lislis.sblo.jp/

// .arrowMark(target, options)
// Create Arrowmark to the target.
//   target : Target jQuery object
//   options : Options
//   options.strokeColor : Border color
//   options.fillColor : Fill color
//   options.lineWidth : Border width
//   options.barWidth : Width of the bar of the ArrowMark
//   options.arrowWidth : Width of the head of the arrow
//   options.arrowLength : Length of the head of the arrow
//   options.clipMargin : Margin from the elements
//   options.zIndex : z-index
//   options.monitor : If true, the Arrowmark chaces after connected elements

// .arrowMarkByLink(options)
// Connect the parent of <a href="#foo"> to the parent of <a name="foo">
//   options : Same as .arrowMark()

// .getArrowMark()
// Return jQuery objects of ArrowMark Canvas element.

// .deleteArrowMark()
// Delete Arrowmark.


(function($) {
    // Create arrowMark from this to $targetObj.
    $.fn.arrowMark = function($targetObj, options) {
        var f = $.fn.arrowMark;
        var newCanvas = false;
        var draw = true;
        options = $.extend({
            strokeColor: "#ffffff",
            fillColor: "#000000",
            lineWidth: 0,
            clipMargin: 4,
            barWidth: 3,
            arrowWidth: 12,
            arrowLength: 16,
            arrow: "target", // Not implemented
            zIndex: 10,
            monitor: false,
            clip: true,
            refresh: false // Internal option
        }, options || {});
        return this.each(function() {
            var $element = $(this);
            $targetObj.each(function(){
                var $target = $(this);

                var $canvas;
                if(options.refresh){
                    $canvas = options.refresh;
                    options = $.extend(options, options.options || {});
                }else{
                    $canvas = $element.getArrowMark($target);
                    if(!$canvas.length){
                        newCanvas = true;
                        delete options.refresh;
                        $canvas = f.createNewCanvas($element, $target, options);
                        $canvas.css("pointer-events", "none"); // ver1.01: Added to through mouse events. (It does't work on IE8 nor Opera10.54.)
                    }
                }

                var position = f.getPosition($element, options.clipMargin);
                var targetPosition = f.getPosition($target, options.clipMargin);
                if(options.clip){
                     f.clip(position, targetPosition);
                     f.clip(targetPosition, position);
                }
                if(options.refresh){
                    var oldPosition = $canvas.data("arrowMarkPosition") || {};
                    var oldTargetPosition = $canvas.data("arrowMarkTargetPosition") || {};
                    if(
                        oldPosition.x == position.x &&
                        oldPosition.y == position.y &&
                        oldTargetPosition.x == targetPosition.x &&
                        oldTargetPosition.y == targetPosition.y
                    ){
                        draw = false;
                    }
                }

                if(draw){
                    if(f.checkVisible(position, targetPosition)){
                        var points = f.createArrowMark(position.x, position.y, targetPosition.x, targetPosition.y, options);
                        var size = f.pack(points, options.lineWidth);
                    }else{
                        points = [];
                        size = {left: 0, top: 0, width: 0, height: 0};
                    }

                    if(size.width != $canvas.attr("width") || size.height != $canvas.attr("height")){
                        $canvas.attr({width: size.width, height: size.height});
                    }
                    $canvas.css({left: size.left, top: size.top, zIndex: options.zIndex});
                    if(window.G_vmlCanvasManager){ // for IE6-8 to work ExplorerCanvas
                        $canvas = $(window.G_vmlCanvasManager.initElement($canvas.get(0)));
                    }
                    if($canvas.get(0).getContext){
                        var ctx = $canvas.get(0).getContext("2d");
                        if(!position.notVisible && !targetPosition.notVisible){
                            f.drawArrow(ctx, points, options);
                        }
                    }
                    
                    $canvas.data("arrowMarkPosition", position);
                    $canvas.data("arrowMarkTargetPosition", targetPosition);

                    if(!f.intervalId && options.monitor){
                        f.intervalId = setInterval(f.refreshArrowMarks, 15);
                    }
                }
            });
        });
    };

    // Create arrowMarka by <a href="#?">. Link between persons of <a>.
    $.fn.arrowMarkByLink = function(options){
        var f = $.fn.arrowMark;
        return this.each(function(){
            var targetname = $(this).attr("href");
            if(targetname){
                targetname = targetname.substr(1);
                $(this).parent().arrowMark($("a[name='" + targetname + "']").parent(), options);
            }
        });
    };

    // Get arrowMark Canvas that the Element owns.
    $.fn.getArrowMark = function($targetObj){
        var f = $.fn.arrowMark;
        if(!$targetObj) return f.getArrowMarks(this);
        var arrowMarkCanvas = "";
        this.each(function(){
            var $element = $(this);
            $targetObj.each(function(){
                var $target = $(this);
                var arrowMark0 = $element.data("arrowMark0");
                var arrowMark1 = $target.data("arrowMark1");
                if(arrowMark0 && arrowMark1){
                    for(var i in arrowMark0){
                        for(var j in arrowMark1){
                            if(arrowMark0[i] == arrowMark1[j]){
                                if(arrowMarkCanvas) arrowMarkCanvas += ",";
                                arrowMarkCanvas += "#" + arrowMark0[i];
                            }
                        }
                    }
                }
            });
        });
        return $(arrowMarkCanvas);
    };

    // Delete arrowMarks Canvas that the Element owns.
    $.fn.deleteArrowMark = function(){
        var f = $.fn.arrowMark;
        this.each(function(){
            var arrowMark0 = $(this).data("arrowMark0");
            if(arrowMark0){
                for(var i in arrowMark0){
                    f.deleteArrowMarkCanvas($("#" + arrowMark0[i]));
                }
            }
        });
    };

    // (Internal) Refresh arrowMarks
    $.fn.arrowMark.refreshArrowMarks = function(){
        var f = $.fn.arrowMark;
        var relatedObj = f.relatedObj;
        for(var i in relatedObj){
            var obj = relatedObj[i];
            var $element = $(obj.arrowMark0);
            var $target = $(obj.arrowMark1);
            if($element.parent().length && $target.parent().length){
                if(obj.options.monitor){
                    $element.arrowMark($target, {refresh: $(obj.canvas), options: obj.options});
                }
            }else{
                $(obj.canvas).remove();
                delete relatedObj[i];
            }
        }
    };
    
    $.fn.arrowMark.intervalId = 0;

    // (Internal) Get arrowMarks of the Element.
    $.fn.arrowMark.getArrowMarks = function($elementObj){
        var arrowMarkCanvas = "";
        $elementObj.each(function(){
            var $element = $(this);
            var arrowMark0 = $element.data("arrowMark0");
            if(arrowMark0){
                for(var i in arrowMark0){
                    if(arrowMarkCanvas) arrowMarkCanvas += ",";
                    arrowMarkCanvas += "#" + arrowMark0[i];
                }
            }
        });
        return $(arrowMarkCanvas);
    };

    $.fn.arrowMark.idCount = 0;

    $.fn.arrowMark.relatedObj = {};

    // (Internal) Create a new Canvas Element of the arrowMark.
    $.fn.arrowMark.createNewCanvas = function($element, $target, options){
        var f = $.fn.arrowMark;
        var $canvas = $("<canvas></canvas>");
        $("body").append($canvas);
        $canvas.css("position", "absolute");
        var arrowMarkId = "__arrowmark__" + f.idCount;
        $canvas.attr("id", arrowMarkId);
        var arrowMark0 = $element.data("arrowMark0");
        arrowMark0 = arrowMark0 || {};
        arrowMark0[f.idCount] = arrowMarkId;
        $element.data("arrowMark0", arrowMark0);
        var arrowMark1 = $target.data("arrowMark1");
        arrowMark1 = arrowMark1 || {};
        arrowMark1[f.idCount] = arrowMarkId;
        $target.data("arrowMark1", arrowMark1);
        f.relatedObj[arrowMarkId] = {
            canvas: $canvas.get(0),
            arrowMark0: $element.get(0),
            arrowMark1: $target.get(0),
            options: options
        };
        f.idCount++;
        return $canvas;
    };

    // (Internal) Delete the Canvas Element of arrowMark.
    $.fn.arrowMark.deleteArrowMarkCanvas = function($element){
        var f = $.fn.arrowMark;
        var id = $element.attr("id");
        if(id){
            var relatedObj = f.relatedObj[id];
            if(relatedObj && relatedObj.arrowMark0){
                var arrowMark0 = $(relatedObj.arrowMark0).data("arrowMark0");
                if(arrowMark0){
                    for(var i in arrowMark0){
                        if(arrowMark0[i] == id){
                            delete arrowMark0[i]; 
                        }
                    }
                    $(relatedObj.arrowMark0).data("arrowMark0", arrowMark0);
                }
            }
            if(relatedObj && relatedObj.arrowMark1){
                var arrowMark1 = $(relatedObj.arrowMark1).data("arrowMark1");
                if(arrowMark1){
                    for(var i in arrowMark1){
                        if(arrowMark1[i] == id){
                            delete arrowMark1[i]; 
                        }
                    }
                    $(relatedObj.arrowMark1).data("arrowMark1", arrowMark1);
                }
            }
            $element.remove();
            delete f.relatedObj[id];
        }
    };

    // (Internal) Clip the arrowMark length.
    $.fn.arrowMark.clip = function(position, targetPosition){
        var dx = targetPosition.x - position.x;
        var dy = targetPosition.y - position.y;
        if(targetPosition.x > position.x1){
            var dx1 = (position.x1 - position.x) / dx;
            var y = position.y + dy * dx1;
            if(y >= position.y0  && y <= position.y1){
                position.x = position.x1;
                position.y = y;
            }
        }else if(targetPosition.x < position.x0){
            var dx1 = (position.x0 - position.x) / dx;
            var y = position.y + dy * dx1;
            if(y >= position.y0 && y <= position.y1){
                position.x = position.x0;
                position.y = y;
            }
        }
        if(targetPosition.y > position.y1){
            var dy1 = (position.y1 - position.y) / dy;
            var x = position.x + dx * dy1;
            if(x >= position.x0 && x <= position.x1){
                position.y = position.y1;
                position.x = x;
            }
        }else if(targetPosition.y < position.y0){
            var dy1 = (position.y0 - position.y) / dy;
            var x = position.x + dx * dy1;
            if(x >= position.x0 && x <= position.x1){
                position.y = position.y0;
                position.x = x;
            }
        }
    };

    $.fn.arrowMark.checkVisible = function(position, targetPosition){
        if((
            targetPosition.x >= position.x0 &&
            targetPosition.x <= position.x1 &&
            targetPosition.y >= position.y0 &&
            targetPosition.y <= position.y1
        ) || (
            position.x >= targetPosition.x0 &&
            position.x <= targetPosition.x1 &&
            position.y >= targetPosition.y0 &&
            position.y <= targetPosition.y1
        )){
            return false;
        }
        return true;
    };

    // (Internal) Get the position of the Element.
    $.fn.arrowMark.getPosition = function($obj, margin){
        margin = margin ? margin : 0;
        var position = $obj.offset();
        var left = position.left - margin;
        var top = position.top - margin;
        var width = $obj.outerWidth() + margin * 2;
        var height = $obj.outerHeight() + margin * 2;
        return {
            x0: left,
            y0: top,
            x1: left + width,
            y1: top + height,
            x: left + width / 2,
            y: top + height / 2,
            width: width,
            height: height,
            notVisible: false
        };
    };

    // (Internal) Create a line image of arrowMark.
    $.fn.arrowMark.createArrowMark = function(x0, y0, x1, y1, options){
        var barWidth = options.barWidth;
        var arrowWidth = options.arrowWidth;
        var arrowLength = options.arrowLength;
        var dx = x1 - x0;
        var dy = y1 - y0;
        var lineLength = Math.sqrt(dx * dx + dy * dy) - arrowLength;
        if(lineLength <= 0){
            lineLength = 0;
        }

        // create arrow
        var points = [
            {x: 0, y: -barWidth / 2},
            {x: lineLength, y: -barWidth / 2},
            {x: lineLength, y: -arrowWidth / 2},
            {x: lineLength + arrowLength, y: 0},
            {x: lineLength, y: arrowWidth / 2},
            {x: lineLength, y: barWidth / 2},
            {x: 0, y: barWidth / 2}
        ]


        var rad = Math.atan2(dy, dx);
        if(rad > 0 && dy < 0){
            rad += -Math.PI;
        }else if(rad < 0 && dy > 0){
            rad += Math.PI;
        }
        
        // rotate arrow
        for(var i = 0; i < points.length; i++){
            var x = points[i].x;
            var y = points[i].y;
            points[i].x = x * Math.cos(rad) - y * Math.sin(rad) + x0;
            points[i].y = x * Math.sin(rad) + y * Math.cos(rad) + y0;
        }
        return points;
    };

    // (Internal) Trim the line image of arrowMark.
    $.fn.arrowMark.pack = function(points, margin){
        if(points.length < 2){
            return {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            };
        }
        var minX = points[0].x;
        var maxX = minX;
        var minY = points[0].y;
        var maxY = minY;
        for(var i = 1; i < points.length; i++){
            minX = (minX <= points[i].x) ? minX : points[i].x;
            minY = (minY <= points[i].y) ? minY : points[i].y;
            maxX = (maxX >= points[i].x) ? maxX : points[i].x;
            maxY = (maxY >= points[i].y) ? maxY : points[i].y;
        }
        margin = margin ? margin : 0;
        margin++;
        minX-= margin;
        minY-= margin;
        maxX+= margin;
        maxY+= margin;
        
        for(var i = 0; i < points.length; i++){
            points[i].x -= minX;
            points[i].y -= minY;
        }
        return {
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    };

    // (Internal) Draw an arrowMark to the Canvas.
    $.fn.arrowMark.drawArrow = function(ctx, points, options){
        if(points.length < 2) return;
        ctx.save();
        ctx.fillStyle = options.fillColor;
        ctx.lineWidth = options.lineWidth;
        ctx.lineJoin = "round";
        ctx.strokeStyle = options.strokeColor;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for(var i = 1; i < points.length; i++){
            ctx.lineTo(points[i].x, points[i].y);
        }
        if(options.lineWidth){
            ctx.closePath();
            ctx.stroke();
        }
        ctx.fill();
        ctx.restore();
    };

})(jQuery);
