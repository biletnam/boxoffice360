//Detect browser support for CORS

// if ('withCredentials' in new XMLHttpRequest()) {
//     /* supports cross-domain requests */
//     alert("CORS supported (XHR)");
// }
// else if(typeof XDomainRequest !== "undefined"){
//     //Use IE-specific "CORS" code with XDR
//     alert("CORS supported (XDR)");
// }else{
//     //Time to retreat with a fallback or polyfill
//     alert("No CORS Support! Please enable CORS support before running");
// }

var sortkeys = ["Sort by Rating", "Sort by Movie Facebook Likes", "Sort by Budget", "Sort by Duration"];
var selectedYear=1985;
var moviesData;


function updateBarChart(data) {

    var margin = {top: 20, right: 20, left: 20, bottom: 20};

    var svg = d3.select("#barChartsvg"),
        xAxisWidth = 650,
        yAxisHeight = 450;




    var width = xAxisWidth - margin.left - margin.right;
    var height = yAxisHeight - margin.top - margin.bottom;


    svg.attr('width', width)
        .attr('height',height);


    var highGrossingData = data.sort(function(a,b){

        return b.gross - a.gross;
    });

    var top5HighGrossingData = highGrossingData.slice(0,5);


    var max = d3.max(top5HighGrossingData, function(d){


        return d.gross;
    })        ;


    var xScale = d3.scaleLinear()
        .domain([0 , max])
        .range([0,width]);

    console.log('xscale max = '+max);

    var yScale = d3.scaleBand()
        .range([0, height]).padding(.1);

    var xAxis = d3.axisBottom();
    xAxis.scale(xScale);


    yScale.domain(data.map(function (d) {
        return d.movie_title;
    }));

    var yHeight = (450 - margin.top - margin.bottom)/5;

    var bars = d3.select('#barChartg')
        .selectAll('.bars')
        .data(top5HighGrossingData);

    bars.exit()
        .remove();

    bars = bars.enter()
        .append('rect')
        .merge(bars);

    var textWidth = 80;

    bars.attr('class','bars')
        .attr('x', textWidth)
        .attr('y', function(d,i){

            if(i==0)
                return 0;
            else
                return (yHeight + 4)*i;
        })
        .attr('width',function (d) {

            if(d.gross)
                return xScale(d.gross) - xScale(0);
            else
                return 0;
        })
        .attr('height', function (d) {

            return yHeight;

        });

}


d3.csv("data/movie_metadata.csv", function (error, csvData) {
    var yearList = [];

    moviesData = csvData;

    csvData.forEach(function (d, i) {
        d.actors = d.actor_1_name + ',' + d.actor_2_name + ',' + d.actor_3_name;
        if (yearList.indexOf(d.title_year) === -1) {
            if (d.title_year) {
                yearList.push(d.title_year);
            }
        }
    });


    yearList.sort();
    var slider = d3.slider()
        .min(d3.min(yearList))
        .max(d3.max(yearList))
        .ticks(10)
        .tickFormat(Math.ceil)
        .showRange(true)
        .value(d3.max(yearList))
        .callback(updateOnSliderChange);

    d3.select('#year-slider').call(slider);

    function updateOnSliderChange(slider) {
        var year = Math.ceil(slider.value());
        selectedYear = year;
        var yearData = csvData.filter(function (d) {
            return d.title_year == year;
        });
        if (yearData.length >= 1) {
            updateVis(yearData, "movie_title");
        }
        else {
            alert("No movies processed for year " + selectedYear);
        }
        var buttons = document.getElementById("sort-buttons");
        while (buttons.firstChild) {
            buttons.removeChild(buttons.firstChild);
        }
        for (var i = 0; i < sortkeys.length; i++) {
            var but = document.createElement('input');
            but.type = "button";
            but.value = sortkeys[i];
            switch (sortkeys[i]) {
                case "Sort by Rating":
                    but.onclick = function(){sortbyrating(yearData)};
                    but.id = "but-rating";
                    break;
                case "Sort by Movie Facebook Likes":
                    but.onclick = function(){sortbylikes(yearData)};
                    but.id = "but-likes";
                    break;
                case "Sort by Budget":
                    but.onclick = function(){sortbybudget(yearData);}
                    but.id = "but-budget";
                    break;
                case "Sort by Duration":
                    but.onclick = function(){sortbyduration(yearData)};
                    but.id = "but-duration";
                    break;
            }
            buttons.appendChild(but);

            updateBarChart(yearData);

        }

    }

});
    function updateVis(yearData, text) {

        var requests = yearData.length;
        generateBlanktilesandButtons(yearData.length);
        var i = 0;
        while (requests > 0) {
            var url = "http://imdb.wemakesites.net/api/" + yearData[i].movie_imdb_link.split("/")[4];
            updateTile(url, "mtile-" + (i + 1).toString(), yearData[i][text]);
            // updatetile("mtile-"+(i+1).toString(),imageurl,yearData[i].movie_title);
            i++;
            requests--;
        }

    }

    function updateTile(url, tileid, title) {
        var req = $.getJSON(url, function (response) {
            //console.log("image url:", response.data.image);
        });
        $.when(req).done(function (response) {
            updateImage(tileid, response.data.image, title)
        })


    }

    function generateBlanktilesandButtons(n) {
        //console.log("generating ", n, " blank tiles");
        var alltiles = document.getElementById("movie-tiles");
        while (alltiles.firstChild) {
            alltiles.removeChild(alltiles.firstChild);
        }
        for (var i = 0; i < n; i++) {
            console.log('in loop generate blank tile');
            var div = document.createElement("div");
            div.setAttribute("id", "mtile-"+(i+1).toString());
            div.setAttribute("class", "movie-tile");

            var img = document.createElement("img");
            img.setAttribute("src", "img/loading.gif");
            img.setAttribute("id", "img-mtile-"+(i+1).toString())
            img.setAttribute("height", "250");
            img.setAttribute("width", "250");
            img.setAttribute("alt", "Please Wait While image is loaded");
            var txt = document.createElement("span");
            txt.innerHTML = "Please Wait";
            txt.setAttribute("id", "txt-mtile-"+(i+1).toString());
            txt.setAttribute("class", "movie-title");
            div.appendChild(img);
            div.appendChild(txt);
            alltiles.appendChild(div);
       }


    }

    function sortbyrating(yearData) {
        yearData.sort(function (x, y) {
            return d3.descending(parseFloat(x.imdb_score), parseFloat(y.imdb_score));
        });
        updateVis(yearData, "imdb_score");
    }

    function sortbylikes(yearData) {
        yearData.sort(function (x, y) {
            return d3.descending(parseInt(x.movie_facebook_likes), parseInt(y.movie_facebook_likes));
        });
        updateVis(yearData, "movie_facebook_likes");

    }

    function sortbybudget(yearData) {
        yearData.sort(function (x, y) {
            return d3.descending(parseInt(x.budget), parseInt(y.budget));
        });
        updateVis(yearData, "budget");

    }

    function sortbyduration(yearData) {
        yearData.sort(function (x, y) {
            return d3.descending(parseInt(x.duration), parseInt(y.duration));
        });
        updateVis(yearData, "duration");

    }

    function updateImage(tileid, url, title) {
        console.log("updating " + tileid + " with ", title);
        var tile = d3.select("#" + tileid).select("img");

        var tile = d3.select("#" + tileid);
        tile.classed("movie-tile", true);
        var image = document.getElementById(tileid).firstChild;
        var downloadingImage = new Image();
        downloadingImage.onload = function () {
            image.src = this.src;
            image.alt = title;
            image.title = title;
        };
        downloadingImage.src = url;
        var txt=d3.select('#'+tileid).select("#txt-"+tileid);
        txt.innerHTML = title;


        image.addEventListener('click',function(d){

            var movie = moviesData.filter(function(d){

                return d.movie_title.toLowerCase() == title.toLowerCase();
            });

            d3.select('#movie')
                .text(function() {

                    return 'Movie: ' + movie[0].movie_title;

                });

            d3.select('#director')
                .text(function(){

                    if(movie[0].director_name)
                        return 'Director: ' + movie[0].director_name;
                    else
                        'Director: ' + 'Not Available';
                });

            d3.select('#actors')
                .text(function(){

                    return 'Actors: ' + movie[0].actor_1_name +' , '+ movie[0].actor_2_name +' , '+ movie[0].actor_3_name;
                });

            d3.select('#genre')
                .text(function(){

                    return 'Genre: ' + movie[0].genres;
                });

        });
    }

