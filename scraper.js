
/*
 * Setup input and button
 */
$(function() {
	$('#gobtn').click(function() {
		new SCRAPER($('#app-id').val()).start();
	});
});

/*
 * Setup Scraper object
 */

/*
 * Init scraper
 */
function SCRAPER(appId) {

	this.appId = appId;
};


/*
 * Actually start the scraping... also loads the list of app stores
 */
SCRAPER.prototype.start = function() {
	var codes = [],
		fn = this;

	// Load list of app stores
	$.get('AppStores.txt',
		function(data) {

		var lines = data.split('\n'),
			i, len = lines.length - 1,
			code, c,
			reviews = [];

		for(i=0;i<len;i++) {
			c = lines[i].split('\t');
			code = {
				'country' : c[0],
				'code'    : c[1],
				'storeid' : c[2]
			};
			codes.push(code);
		}

		console.log('Loaded ' + codes.length + ' app stores');

		// Load framework
		for(i=0;i<codes.length;i++) {
			var h = [
				'<div id="rpt-', codes[i].code, '" ',
				'class="report span-20 last">',
				'<div class="large country span-20 last">',
				codes[i].country,
				'</div></div>'];

				$('#report-container').append(h.join(''));
		}


		fn.go(0, codes);
	});
};

/*
 * Self loop for scraping through the app stores
 */
SCRAPER.prototype.go = function(i, codes) {

	var fn = this;

	// Loop through app stores
	if(i < codes.length) {

		fn.do_scrape(codes[i].code, codes[i].storeid,
			function(review) {
				var j=0; len = review.length;

				for(k=0;j<len;j++) {
					var h = [
						'<div class="review span-20 last">',
						'<div class="user span-4">',
						review[j].user,
						'</div>',
						'<div class="title span-16 last">',
						review[j].title,
						'</div>',
						'<div class="stars span-16 last">',
						review[j].stars,
						'</div>',
						'<div class="rev-content span-20 last">',
						review[j].review,
						'</div>',
						'</div>'];

					$(['#rpt-', review[j].storeCode].join('')).append(h.join(''));
				}

				i++;
				fn.go(i, codes);
			}
		);

	}
};


/*
 * This is where the actual request is made and the data is extracted
 */
SCRAPER.prototype.do_scrape = function(storeCode, storeId, cb) {

	var //path = 'http://itunes.apple.com/' + storeCode + '/app/split-screen/id453757310?mt=12',
		path = 'http://itunes.apple.com/WebObjects/MZStore.woa/wa/customerReviews?displayable-kind=30&id=' + this.appId,
		data = [],
		s1, s2;


	console.log('Lets scrape, store id ' + storeId);
	s1 = new Date().getTime();

	$.ajax(
		{
			type : 'GET',
			url  : path,
			headers : {
					'User-Agent' : 'MacAppStore/1.1.1 (Macintosh; U; Intel Mac OS X 10.7.1; en) AppleWebKit/534.48.3',
					'X-Apple-Connection-Type' : 'WiFi',
					'X-Apple-Partner' : 'origin.0',
					'X-Apple-Store-Front' : storeId + '-1,13'
			},
			success : function(data) {
					var reviews = [];
					$(data).find('.customer-review').each(
						function(idx) {
							var ret = {};
							ret.title     = $(this).find('.customerReviewTitle').text();
							ret.user      = $(this).find('.user-info').text();
							ret.review    = $(this).find('p.content').text();
							ret.stars     = $(this).find('div.rating').attr('aria-label');
							ret.storeCode = storeCode;
							reviews.push(ret);

						}
					);

					s2 = new Date().getTime();
					console.log('Processing finished for store ' + storeCode + ' .  Total time taken - ' + (s2 - s1)/1000 + 's');
					// Send callback
					cb(reviews);
				}
		}
	)
	.error(function(err) {
		console.error('Error for store ' + storeCode);
		cb([]);
	});

};

